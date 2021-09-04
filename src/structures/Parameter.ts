import { CategoryChannel, Guild, GuildMember, NewsChannel, Role, StageChannel, StoreChannel, TextChannel, VoiceChannel } from "discord.js";
import { ParameterType, ParameterResolvable, ParameterSchema } from "../types/Parameter.js";

/**
 * @class Representation of command parameter
 * @exports
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

    constructor(options: ParameterSchema) {
        this.name = options.name;
        this.description = options.description || "No description";
        this.optional = options.optional;
        this.type = options.type;
        this.choices = options.choices;
        if (!/^[\w-]{1,32}$/.test(this.name)) {
            throw new Error(`Parameter name ${this.name} doesn't match the pattern`);
        }
        if (this.description.length > 100) {
            throw new Error(`Parameter ${this.name}: Description too long`);
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

/**
 * @class Representation of input parameter (argument) coming from a message or an interaction
 * @extends Parameter
 * @exports
 */
export class InputParameter extends Parameter {
    /**
     * Input value
     * @type {ParameterResolvable}
     */
    public readonly value: ParameterResolvable;

    constructor(parameter: Parameter, value: ParameterResolvable) {
        super(parameter);
        this.value = value;
    }
}

export class StringParameter extends InputParameter {
    constructor(parameter: Parameter, value: ParameterResolvable) {
        if (parameter.type != "string") {
            throw new Error(`Parameter type mismatch`);
        }
        if (parameter.choices) {
            const match = parameter.choices.filter((c) => c.toLowerCase() === value?.toString().toLowerCase());
            if (match.length === 0) {
                throw new Error(`Parameter "${parameter.name}" has incorrect value. Please enter one of the following values: ${parameter.choices.join(", ")}`);
            } else {
                super(parameter, match[0]);
                return;
            }
        }
        super(parameter, value?.toString());
    }
}

export class BooleanParameter extends InputParameter {
    constructor(parameter: Parameter, value: ParameterResolvable) {
        if (parameter.type != "boolean") {
            throw new Error(`Parameter type mismatch`);
        }
        if (value?.toString().toLowerCase() === "true") {
            super(parameter, true);
        } else if (value?.toString().toLowerCase() === "false") {
            super(parameter, false);
        } else {
            throw new Error(`Cannot convert "${parameter.name}" parameter to boolean. Please enter either "true" or "false".`);
        }
    }
}

export class NumberParameter extends InputParameter {
    constructor(parameter: Parameter, value: ParameterResolvable) {
        if (parameter.type != "number") {
            throw new Error(`Parameter type mismatch`);
        }
        super(parameter, parseFloat(value ? value.toString() : ""));
    }
}

export class ObjectParameter extends InputParameter {
    constructor(parameter: Parameter, value: ParameterResolvable) {
        if (parameter.type != "channel" && parameter.type != "mentionable" && parameter.type != "user" && parameter.type != "role") {
            throw new Error(`Parameter type mismatch`);
        }
        super(parameter, new ObjectID(value?.toString() || ""));
    }
}

export class ObjectID {
    public readonly id: string;

    constructor(id: string) {
        this.id = id.replace(">", "").replace("<@!", "").replace("<#!", "");
    }

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
