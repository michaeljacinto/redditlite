import { validateRegister } from './../utils/validateRegister';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from './../constants';
import { MyContext } from 'src/types';
import { Mutation, Arg, Resolver, Field, Ctx, ObjectType, Query } from "type-graphql";
import { User } from './../entities/User';
import "reflect-metadata";
import argon2 from 'argon2';
import { EntityManager } from '@mikro-orm/postgresql';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { sendEmail } from './../utils/sendEmail';
import { v4 } from 'uuid';

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
    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { redis, em }: MyContext
    ) {
        const user = await em.findOne(User, { email })
        console.log(user);
        if (!user) {
            // the email is not in the db
            console.log(user);
            console.log('here1');
            return true;
        }

        const token = v4();

        await redis.set(FORGET_PASSWORD_PREFIX + token,
            user._id,
            'ex',
            1000 * 60 * 60 * 24 * 3
        );

        console.log('here');
        await sendEmail(email, `'<a href="http://localhost:3000/change-password/${token}">Reset password</a>'`)
        return true;
    }

    @Query(() => User, { nullable: true })
    async me(
        @Ctx() { req, em }: MyContext
    ) {
        // not logged in
        if (!req.session.userId) {
            return null;
        }

        const user = await em.findOne(User, { _id: req.session.userId });
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput, // <-- explicity says GraphQL type
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {

        const errors = validateRegister(options);

        if (errors) {
            return { errors };
        }

        const hashedPassword = await argon2.hash(options.password)
        // const user = em.create(User, { username: options.username, password: hashedPassword });
        let user;
        try {
            const result = await (em as EntityManager).createQueryBuilder(User).getKnexQuery().insert(
                {
                    username: options.username,
                    password: hashedPassword,
                    email: options.email,
                    created_at: new Date(),
                    updated_at: new Date(),
                }
            ).returning("*");
            // await em.persistAndFlush(user);
            user = result[0];
        } catch (err) {
            if (err.code === '23505') {
                // duplicate username error
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
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User,
            usernameOrEmail.includes('@') ?
                { email: usernameOrEmail }
                : { username: usernameOrEmail }
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