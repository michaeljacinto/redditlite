import { validateRegister } from './../utils/validateRegister';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from './../constants';
import { MyContext } from 'src/types';
import { Mutation, Arg, Resolver, Field, Ctx, ObjectType, Query } from "type-graphql";
import { User } from './../entities/User';
import "reflect-metadata";
import argon2 from 'argon2';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { sendEmail } from './../utils/sendEmail';
import { v4 } from 'uuid';
import { getConnection } from 'typeorm';

@ObjectType() // <-- return values
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType() // <-- return values
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];
    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { redis, req }: MyContext
    ): Promise<UserResponse> {

        if (newPassword.length <= 2) {
            return {
                errors: [
                    {
                        field: 'newPassword',
                        message: 'Password must be greater than 2.'
                    },
                ],
            };
        }
        const key = FORGET_PASSWORD_PREFIX + token;
        const userId = await redis.get(key);
        if (!userId) {
            return {
                errors: [
                    {
                        field: 'token',
                        message: 'Token has expired.'
                    },
                ],
            };
        }

        const userIdNum = parseInt(userId);
        const user = await User.findOne(userIdNum);

        if (!user) {
            return {
                errors: [
                    {
                        field: 'token',
                        message: 'User no longer exists.'
                    },
                ],
            };
        }

        user.password = await argon2.hash(newPassword);
        await User.update(
            {
                _id: userIdNum
            },
            {
                password: await argon2.hash(newPassword)
            }
        )
        await redis.del(key);

        // Auto login after changing new password
        req.session.userId = user._id;

        return { user };
    }


    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { redis }: MyContext
    ) {
        const user = await User.findOne({ where: { email } })
        console.log(user);
        if (!user) {
            return true;
        }

        const token = v4();

        await redis.set(FORGET_PASSWORD_PREFIX + token,
            user._id,
            'ex',
            1000 * 60 * 60 * 24 * 3
        );

        console.log('here');
        await sendEmail(email, `<a href="http://localhost:3000/change-password/${token}">Reset password</a>`)
        return true;
    }

    @Query(() => User, { nullable: true })
    me(
        @Ctx() { req }: MyContext
    ) {
        // not logged in
        if (!req.session.userId) {
            return null;
        }

        return User.findOne(req.session.userId);
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput, // <-- explicity says GraphQL type
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {

        const errors = validateRegister(options);

        if (errors) {
            return { errors };
        }

        const hashedPassword = await argon2.hash(options.password)
        // const user = em.create(User, { username: options.username, password: hashedPassword });
        let user;
        try {
            const result = await getConnection()
                .createQueryBuilder()
                .insert()
                .into(User)
                .values({
                    username: options.username,
                    password: hashedPassword,
                    email: options.email,
                })
                .returning('*')
                .execute();

            console.log(result);
            // const result = await (em as EntityManager)
            // .createQueryBuilder(User)
            // .getKnexQuery()
            // .insert(
            //     {
            //         username: options.username,
            //         password: hashedPassword,
            //         email: options.email,
            //         created_at: new Date(),
            //         updated_at: new Date(),
            //     }
            // ).returning("*");
            // // await em.persistAndFlush(user);
            // user = result[0];
            user = result.raw;
        } catch (err) {
            if (err.code === '23505') {
                // duplicate username error
                console.log('err');
                return {
                    errors: [
                        {
                            field: "username",
                            message: "This username has been taken."
                        },
                    ],
                };
            }
        }

        // store user id session. stores cookie on the user

        req.session.userId = user._id;
        return { user }; // <-- return user object instead of return user
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string, // <-- explicity says GraphQL type
        @Ctx() { req }: MyContext
    ): Promise<UserResponse> {
        const user = await User.findOne(
            usernameOrEmail.includes('@') ?
                { where: { email: usernameOrEmail } }
                : { where: { username: usernameOrEmail } }
        )
        if (!user) {
            return {
                errors: [
                    {
                        field: 'usernameOrEmail',
                        message: "User does not exist"
                    }
                ]
            }
        }
        const valid = await argon2.verify(user.password, password)
        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Password is incorrect"
                    },
                ],
            };
        }

        req.session.userId = user._id;

        return {
            user,
        };
    }

    @Mutation(() => Boolean)
    logout(
        @Ctx() { req, res }: MyContext
    ) {
        return new Promise((resolve =>
            req.session.destroy((err) => {
                res.clearCookie(COOKIE_NAME);
                if (err) {
                    console.log(err);
                    resolve(false);
                    return;
                }
                resolve(true);
            })
        )
        );
    }
}