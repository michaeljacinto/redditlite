import { MyContext } from 'src/types';
import { Mutation, Arg, Resolver, InputType, Field, Ctx, ObjectType } from "type-graphql";
import { User } from './../entities/User';
import "reflect-metadata";
import argon2 from 'argon2';

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
    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput, // <-- explicity says GraphQL type
        @Ctx() { em }: MyContext
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
        const user = em.create(User, { username: options.username, password: hashedPassword });
        try {
            await em.persistAndFlush(user);
        } catch (err) {
            if (err.code === '23505' || err.detail.includes("already exists")) {
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
        return { user }; // <-- return user object instead of return user
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput, // <-- explicity says GraphQL type
        @Ctx() { em }: MyContext
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
        return {
            user,
        };
    }
}