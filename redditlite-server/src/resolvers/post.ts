import { Post } from './../entities/Post';
import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql";
import "reflect-metadata";
import { MyContext } from 'src/types';

@Resolver()
export class PostResolver {
    @Query(() => [Post]) // <-- graphQL type
    posts(
        @Ctx() { em }: MyContext): Promise<Post[]> { // <-- .ts type
        return em.find(Post, {});
    }

    @Query(() => Post, { nullable: true }) // <-- graphQL type
    post(
        @Arg('_id', () => Int) _id: number,
        @Ctx() { em }: MyContext): Promise<Post | null> { // <-- .ts type
        return em.findOne(Post, { _id });
    }

    @Mutation(() => Post) // <-- graphQL type
    async createPost(
        @Arg('title') title: string,
        @Ctx() { em }: MyContext): Promise<Post> { // <-- .ts type
        const post = em.create(Post, { title })
        await em.persistAndFlush(post);
        return post;
    }

    @Mutation(() => Post, { nullable: true }) // <-- graphQL type
    async updatePost(
        @Arg('_id') _id: number,
        @Arg('title', () => String, { nullable: true }) title: string,
        @Ctx() { em }: MyContext): Promise<Post | null> { // <-- .ts type
        const post = await em.findOne(Post, { _id });
        if (!post) {
            return null;
        }
        if (typeof title !== "undefined") {
            post.title = title;
            await em.persistAndFlush(post);
        }
        return post;
    }

    @Mutation(() => Boolean) // <-- graphQL type
    async deletePost(
        @Arg('_id') _id: number,
        @Ctx() { em }: MyContext): Promise<boolean> { // <-- .ts type
        await em.nativeDelete(Post, { _id });
        return true
    }
}