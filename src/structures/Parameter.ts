import { CategoryChannel, DMChannel, Guild, GuildMember, Message, NewsChannel, Role, StageChannel, StoreChannel, TextChannel, VoiceChannel } from "discord.js";
import { ParameterType, ParameterSchema } from "./types/Parameter.js";

/**
 * @class Representation of command parameter
 */
export class Parameter {
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

    constructor(options: ParameterSchema) {
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
    constructor() {
        super({
            name: "input",
            description: "No description",
            type: "string",
            optional: true,
        });
    }
}

export class ObjectID {
    public readonly id: string;

    constructor(id: string) {
        this.id = id.replace(">", "").replace("<@!", "").replace("<#!", "");
    }

    public async toObject(guild: Guild, type: "channel"): Promise<TextChannel | VoiceChannel | CategoryChannel | NewsChannel | StageChannel | StoreChannel | null>;
    public async toObject(guild: Guild, type: "user"): Promise<GuildMember | null>;
    public async toObject(guild: Guild, type: "role"): Promise<Role | null>;
    public async toObject(
        guild: Guild,
        type: "channel" | "user" | "role"
    ): Promise<Role | TextChannel | VoiceChannel | CategoryChannel | GuildMember | NewsChannel | StoreChannel | StageChannel | null> {
        switch (type) {
            case "channel":
                return (await guild.channels.fetch(this.id.toString() || "")) || null;
            case "role":
                return (await guild.roles.fetch(this.id.toString() || "")) || null;
            case "user":
                return (await guild.members.fetch(this.id.toString() || "")) || null;
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
