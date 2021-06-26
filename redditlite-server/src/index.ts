import { UserResolver } from './resolvers/user';
import { HelloResolver } from './resolvers/hello';
import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from "type-graphql";
import { PostResolver } from './resolvers/post';
import "reflect-metadata";
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';
import { createConnection } from 'typeorm'
import { Post } from './entities/Post';
import { User } from './entities/User';


const main = async () => {
    const conn = await createConnection({
        type: 'postgres',
        database: 'redditlite2',
        username: 'postgres',
        password: 'postgres',
        logging: true,
        synchronize: true,
        entities: [Post, User],
    });

    console.log(conn.migrations);

    // await Post.delete({})

    const app = express();

    const RedisStore = connectRedis(session)
    const redis = new Redis();

    app.use(
        cors({
            origin: "http://localhost:3000",
            credentials: true,
        }));

    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({
                client: redis,
                disableTouch: true,
            }),
            saveUninitialized: false,
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
                httpOnly: false,
                secure: false, // cookie only works in https
                sameSite: 'lax', // cstf
            },
            secret: 'qwe290ewmq',
            resave: false,
        })
    )

    app.use(function (req, res, next) {
        if (!req.session) {
            return next(new Error('oh no')) // handle error
        }

        next()
    })

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({ req, res, redis })
    })

    apolloServer.applyMiddleware({
        app,
        cors: false,
    });

    app.listen(4000, () => {
        console.log('server started on localhost:4000');
    })
}

main().catch((err) => {
    console.log(err);
});