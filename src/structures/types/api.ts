/**
 * Discord application command types
 */
export type APICommandType = "CHAT_INPUT" | "USER" | "MESSAGE";

/**
 * Discord base API command object
 */
export interface APICommandObject {
    name: string;
    default_permission: boolean;
}

/**
 * Discord CHAT_INPUT command object
 * @extends APICommandObject
 */
export interface ChatCommandObject extends APICommandObject {
    type: 1;
    description: string;
    options?: ChatCommandOptionObject[];
}

/**
 * Discord CHAT_INPUT command option object
 */
export interface ChatCommandOptionObject {
    name: string;
    description: string;
    type: ChatCommandOptionType;
    required?: boolean;
    choices?: TextCommandOptionChoiceObject[];
    options?: ChatCommandOptionObject[];
}

/**
 * Acceptable CHAT_INPUT command option types
 */
export type ChatCommandOptionType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Discord CHAT_INPUT command choice object
 */
export interface TextCommandOptionChoiceObject {
    name: string;
    value: string;
}

/**
 * Context menu command object
 * @extends APICommandObject
 */
export interface ContextMenuCommandObject extends APICommandObject {
    type: 2 | 3;
}

// export interface NestedCommandObject extends APICommandObject {
//     type: 1;
//     description: string;
//     options: (ChatCommandObject | SubCommandGroupObject)[];
// }

/**
 * API representation of subcommand group
 * @extends APICommandObject
 */
export interface SubCommandGroupObject extends APICommandObject {
    type: 2;
    description: string;
    options: ChatCommandObject[];
}

/**
 * Discord registered command object
 */
export interface RegisteredCommandObject {
    id: string;
    type?: number;
    application_id: string;
    guild_id?: string;
    name: string;
    description: string;
    options?: ChatCommandOptionObject[];
    default_permissions?: boolean;
    version: string;
}

/**
 * Discord permission types
 */
export type CommandPermissionType = "ROLE" | "USER";

/**
 * Discord permissions object
 */
export interface CommandPermission {
    id: string;
    type: CommandPermissionType;
    permission: boolean;
}
