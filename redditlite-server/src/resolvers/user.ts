import { MyContext } from 'src/types';
import { Mutation, Arg, Resolver, InputType, Field, Ctx, ObjectType, Query } from "type-graphql";
import { User } from './../entities/User';
import "reflect-metadata";
import argon2 from 'argon2';
import { EntityManager } from '@mikro-orm/postgresql';

@InputType() // <-- arguments
class UsernamePasswordInput {
    @Field()
    username: string;
    @Field()
    password: string;
}


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
        if (options.username.length <= 2) {
            return {
                errors: [{
                    field: 'username',
                    message: 'Username must be greater than 2 characters.'
                }]
            }
        }
        if (options.password.length <= 3) {
            return {
                errors: [{
                    field: 'password',
                    message: 'Password length must be greater than 3.'
                }]
            }
        }
        const hashedPassword = await argon2.hash(options.password)
        // const user = em.create(User, { username: options.username, password: hashedPassword });
        let user;
        try {
            const result = await (em as EntityManager).createQueryBuilder(User).getKnexQuery().insert(
                {
                    username: options.username,
                    password: hashedPassword,
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
        @Arg('options') options: UsernamePasswordInput, // <-- explicity says GraphQL type
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, { username: options.username })
        if (!user) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: "User does not exist"
                    }
                ]
            }
        }
        const valid = await argon2.verify(user.password, options.password)
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
        console.log(req.session);
        console.log(req.session.userId);

        return {
            user,
        };
    }
}