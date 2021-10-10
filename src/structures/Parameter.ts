import { Guild, Interaction, Message } from "discord.js";
import { MissingParameterError, ParameterTypeError } from "../errors.js";
import { Command } from "../commands/base/Command.js";
import { ParameterType, ParameterSchema, ObjectIdType, ObjectIdReturnType, InputParameterValue, TargetType, TargetIdReturnType } from "./types/Parameter.js";

/**
 * @class Representation of command parameter
 */
export class Parameter<T extends ParameterType> {
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
    public readonly type: T;

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
        this.type = options.type as T;
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

export class DefaultParameter<T extends "string"> extends Parameter<T> {
    constructor(command: Command) {
        super(command, {
            name: "input",
            description: "No description",
            type: "string",
            optional: true,
        });
    }
}

export class InputParameter<T extends ParameterType> extends Parameter<T> {
    value: InputParameterValue<T>;

    constructor(param: Parameter<T>, value: InputParameterValue<T> | null) {
        super(param.command, {
            ...param,
        });
        let val = null;
        if ((value === null || value === undefined) && !this.optional) {
            throw new MissingParameterError(this);
        } else if (value !== null && value !== undefined) {
            switch (this.type) {
                case "mentionable":
                case "channel":
                case "role":
                case "user":
                    if (!(value instanceof ObjectID)) {
                        throw new ParameterTypeError(value, this.type);
                    }
                    val = value;
                    break;
                case "boolean":
                    if (typeof value === "string") {
                        if (value.toLowerCase() === "true") {
                            val = true as InputParameterValue<T>;
                        } else if (value.toLowerCase() === "false") {
                            val = false as InputParameterValue<T>;
                        } else {
                            throw new ParameterTypeError(value, this.type);
                        }
                    } else if ((value as InputParameterValue<T>) === true || (value as InputParameterValue<T>) === false) {
                        val = value as InputParameterValue<T>;
                    } else {
                        throw new ParameterTypeError(value, this.type);
                    }
                    break;
                case "number":
                    const num = parseInt(value.toString());
                    if (isNaN(num)) {
                        throw new ParameterTypeError(value, this.type);
                    }
                    val = num as InputParameterValue<T>;
                    break;
                case "string":
                    if (typeof value === "string" || value.toString()) {
                        val = value.toString() as InputParameterValue<T>;
                    } else {
                        throw new ParameterTypeError(value, this.type);
                    }
                    if (this.choices && this.choices.findIndex((ch) => ch === value) === -1) {
                        throw new TypeError(`Invalid choice. Please enter of the following options: ${this.choices.join(", ")}`);
                    }
                    break;
            }
        }
        this.value = val as InputParameterValue<T>;
    }
}

export class ObjectID<T extends ObjectIdType> {
    public readonly id: string;
    public readonly guild?: Guild;
    public readonly type: T;

    constructor(id: string, type: T, guild?: Guild) {
        this.id = id.replace(">", "").replace("<@!", "").replace("<#!", "").split(" ").join("");
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

export class TargetID<T extends TargetType> {
    public readonly id: string;
    public readonly interaction: Interaction | Message;
    private readonly type: T;

    constructor(id: string, type: T, interaction: Interaction | Message) {
        this.id = id;
        this.type = type;
        this.interaction = interaction;
    }

    toObject(): TargetIdReturnType<T> | null {
        switch (this.type) {
            case "MESSAGE":
                if (!this.interaction.channel) {
                    throw new Error("Channel not found");
                }
                return (this.interaction.channel.messages.cache.get(this.id) as TargetIdReturnType<T>) ?? null;
            case "USER":
                const guild = this.interaction.guild;
                if (!guild) {
                    throw new Error("Guild not found");
                }
                return (guild.members.cache.get(this.id) as TargetIdReturnType<T>) ?? null;
            default:
                return null;
        }
    }
}
