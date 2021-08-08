import {
    CategoryChannel,
    Guild,
    GuildMember,
    NewsChannel,
    Role,
    StageChannel,
    StoreChannel,
    TextChannel,
    VoiceChannel,
} from "discord.js";
import { ParameterType, ParameterResolvable, Choice } from "./types.js";
export interface ParameterSchema {
    name: string;
    description?: string;
    optional: boolean;
    type: ParameterType;
    choices?: Choice[];
}
export class Parameter {
    name: string;
    description: string;
    optional: boolean;
    type: ParameterType;
    choices?: Choice[];

    constructor(options: ParameterSchema) {
        this.name = options.name;
        this.description = options.description || "No description";
        this.optional = options.optional;
        this.type = options.type;
        this.choices = options.choices;
        if (!/^[\w-]{1,32}$/.test(this.name)) {
            throw new Error(
                `Parameter name ${this.name} doesn't match the pattern`
            );
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
export class InputParameter extends Parameter {
    value: ParameterResolvable;

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
        super(parameter, value?.toString());
    }
}
export class BooleanParameter extends InputParameter {
    constructor(parameter: Parameter, value: ParameterResolvable) {
        if (parameter.type != "boolean") {
            throw new Error(`Parameter type mismatch`);
        }
        super(parameter, value ? true : false);
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
        if (
            parameter.type != "channel" &&
            parameter.type != "mentionable" &&
            parameter.type != "user" &&
            parameter.type != "role"
        ) {
            throw new Error(`Parameter type mismatch`);
        }
        super(parameter, new ObjectID(value?.toString() || ""));
    }
}
export class ObjectID {
    id: string;
    constructor(id: string) {
        this.id = id.replace(">", "").replace("<@!", "").replace("<#!", "");
    }
    async toObject(
        guild: Guild,
        type: "channel" | "user" | "role"
    ): Promise<
        | Role
        | TextChannel
        | VoiceChannel
        | CategoryChannel
        | GuildMember
        | NewsChannel
        | StoreChannel
        | StageChannel
        | null
    > {
        switch (type) {
            case "channel":
                return (
                    (await guild.channels.fetch(this.id.toString() || "")) ||
                    null
                );
            case "role":
                return (
                    (await guild.roles.fetch(this.id.toString() || "")) || null
                );
            case "user":
                return (
                    (await guild.members.fetch(this.id.toString() || "")) ||
                    null
                );
        }
    }
}
