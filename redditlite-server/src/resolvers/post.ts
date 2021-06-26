import { Post } from './../entities/Post';
import { Arg, Int, Mutation, Query, Resolver } from "type-graphql";
import "reflect-metadata";
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
    async createPost(
        @Arg('title') title: string): Promise<Post> { // <-- .ts type
        // 2 sql queries
        return Post.create({ title }).save();
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