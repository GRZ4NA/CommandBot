import { MessageEmbed, ReplyMessageOptions } from "discord.js";

export interface BaseCommandInit {
    name: string;
    type: CommandType;
}

export type CommandType = "CHAT" | "MESSAGE" | "USER";

export type CommandFunctionReturnTypes = void | string | MessageEmbed | ReplyMessageOptions | Promise<void | string | MessageEmbed | ReplyMessageOptions>;
