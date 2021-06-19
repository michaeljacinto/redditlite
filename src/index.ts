import { UserResolver } from './resolvers/user';
import { HelloResolver } from './resolvers/hello';
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
// import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from "type-graphql";
import { PostResolver } from './resolvers/post';
import "reflect-metadata";
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';

const main = async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up();
    // const post = orm.em.create(Post, { title: 'my first post' });
    // await orm.em.persistAndFlush(post);
    const app = express();

    const RedisStore = connectRedis(session)
    const redisClient = redis.createClient()

    app.use(
        session({
            name: 'qid',
            store: new RedisStore({
                client: redisClient,
                disableTouch: true,
            }),
            saveUninitialized: false,
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 5,
                httpOnly: true,
                secure: __prod__, // cookie only works in https
                sameSite: 'lax', // cstf
            },
            secret: 'qwe290ewmq',
            resave: false,
        })
    )

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({ em: orm.em, req, res })
    })

    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log('server started on localhost:4000');
    })
}

main().catch((err) => {
    console.log(err);
});