import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class User {
    @Field()
    @PrimaryKey()
    _id!: number;

    @Field(() => String)
    @Property({ type: "date" })
    createdAt: Date = new Date();

    @Field(() => String)
    @Property({ type: "date", onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @Field() // <-- exposes
    @Property({ type: 'text', unique: true })
    username!: string;

    @Field() // <-- exposes
    @Property({ type: 'text', unique: true })
    email!: string;

    // <-- no Field decorator. does not expose.
    @Property({ type: 'text' })
    password!: string;
}