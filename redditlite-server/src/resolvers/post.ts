import { isAuth as checkAuth } from '../middleware/isAuth';
import { MyContext } from './../types';
import { Post } from './../entities/Post';
import { Arg, Ctx, Field, InputType, Int, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import "reflect-metadata";

@InputType()
class PostInput {
    @Field()
    title: string
    @Field()
    text: string
}

@Resolver()
export class PostResolver {
    @Query(() => [Post]) // <-- graphQL type
    posts(): Promise<Post[]> { // <-- .ts type
        return Post.find();
    }

    @Query(() => Post, { nullable: true }) // <-- graphQL type
    post(
        @Arg('_id', () => Int) _id: number): Promise<Post | undefined> { // <-- .ts type
        return Post.findOne(_id);
    }

    @Mutation(() => Post) // <-- graphQL type
    @UseMiddleware(checkAuth)
    async createPost(
        @Arg('input') input: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post> { // <-- .ts type
        return Post.create({
            ...input,
            creatorId: req.session.userId
        }).save();
    }

    @Mutation(() => Post, { nullable: true }) // <-- graphQL type
    async updatePost(
        @Arg('_id') _id: number,
        @Arg('title', () => String, { nullable: true }) title: string
    ): Promise<Post | null> { // <-- .ts type
        const post = await Post.findOne(_id)
        if (!post) {
            return null;
        }
        if (typeof title !== "undefined") {
            post.title = title;
            Post.update({ _id }, { title });
        }
        return post;
    }

    @Mutation(() => Boolean) // <-- graphQL type
    async deletePost(
        @Arg('_id') _id: number
    ): Promise<boolean> { // <-- .ts type
        // await em.nativeDelete(Post, { _id });
        await Post.delete(_id);
        return true;
    }
}
function isAuth(isAuth: any) {
    throw new Error('Function not implemented.');
}

