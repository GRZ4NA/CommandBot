import { DMChannel, Guild, GuildMember, Message, TextChannel } from "discord.js";
import { Command } from "../commands/base/Command.js";
import { ParameterType, ParameterSchema, ObjectIdType, ObjectIdReturnType } from "./types/Parameter.js";

/**
 * @class Representation of command parameter
 */
export class Parameter {
    public readonly command: Command;
    /**
     * Parameter name
     * @type {string}
     */
    public readonly name: string;

    /**
     * Parameter description
     * @type {string}
     */
    public readonly description: string;

    /**
     * Whether this parameter is optional
     * @type {boolean}
     */
    public readonly optional: boolean;

    /**
     * Parameter input type
     * @type {ParameterType}
     */
    public readonly type: ParameterType;

    /**
     * List of value choices (available only when type is set to "STRING")
     */
    public readonly choices?: string[];

    public static nameRegExp: RegExp = /^[\w-]{1,32}$/;
    public static descriptionRegExp: RegExp = /^.{1,100}$/;

    constructor(command: Command, options: ParameterSchema) {
        this.command = command;
        this.name = options.name;
        this.description = options.description || "No description";
        this.optional = options.optional;
        this.type = options.type;
        this.choices = options.choices;
        if (!Parameter.nameRegExp.test(this.name)) {
            throw new Error(`Parameter name ${this.name} doesn't match the pattern`);
        }
        if (!Parameter.descriptionRegExp.test(this.description)) {
            throw new Error(`Parameter ${this.name}: Incorrect description`);
        }
        return;
    }
}

export class DefaultParameter extends Parameter {
    constructor(command: Command) {
        super(command, {
            name: "input",
            description: "No description",
            type: "string",
            optional: true,
        });
    }
}

export class ObjectID<T extends ObjectIdType> {
    public readonly id: string;
    public readonly guild?: Guild;
    public readonly type: T;

    constructor(id: string, type: T, guild?: Guild) {
        this.id = id.replace(">", "").replace("<@!", "").replace("<#!", "");
        this.type = type;
        this.guild = guild;
    }

    public async toObject(): Promise<ObjectIdReturnType<T> | null> {
        switch (this.type) {
            case "channel":
                return ((await this.guild?.channels.fetch(this.id.toString() || "")) as ObjectIdReturnType<T>) ?? null;
            case "role":
                return ((await this.guild?.roles.fetch(this.id.toString() || "")) as ObjectIdReturnType<T>) ?? null;
            case "user":
                return ((await this.guild?.members.fetch(this.id.toString() || "")) as ObjectIdReturnType<T>) ?? null;
            default:
                return null;
        }
    }
}

export class TargetID {
    public readonly id: string;
    private readonly type: "MESSAGE" | "USER";

    constructor(id: string, type: "MESSAGE" | "USER") {
        this.id = id;
        this.type = type;
    }

    toObject(r: Guild): GuildMember | null;
    toObject(r: TextChannel | DMChannel): Message | null;
    toObject(r: Guild | TextChannel | DMChannel): GuildMember | Message | null {
        switch (this.type) {
            case "MESSAGE":
                if (r instanceof TextChannel || r instanceof DMChannel) {
                    return r.messages.cache.get(this.id) || null;
                } else {
                    return null;
                }
            case "USER":
                if (r instanceof Guild) {
                    return r.members.cache.get(this.id) || null;
                } else {
                    return null;
                }
        }
    }
}
