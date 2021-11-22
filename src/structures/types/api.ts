/**
 * Discord application command types
 * CHAT_INPUT - chat interaction (prefix or slash commands)
 * USER  - context menu interaction for user
 * MESSAGE - context menu interaction for message
 * @type
 */
export type APICommandType = "CHAT_INPUT" | "USER" | "MESSAGE";

/**
 * Discord base API command object
 * @interface
 */
export interface APICommandObject {
    /**
     * Command name
     * @type {string}
     */
    name: string;
    /**
     * Discord API default permission
     * @type {boolean}
     */
    default_permission: boolean;
}

/**
 * Discord CHAT_INPUT command object
 * @interface
 * @extends APICommandObject
 */
export interface ChatCommandObject extends APICommandObject {
    /**
     * Command type (forced to 1)
     * @type {number}
     */
    type: 1;
    /**
     * Command description
     * @type {string}
     */
    description: string;
    /**
     * Command options/parameters
     * @type {?Array<ChatCommandOptionObject>}
     */
    options?: ChatCommandOptionObject[];
}

/**
 * Discord CHAT_INPUT command option object
 * @interface
 */
export interface ChatCommandOptionObject {
    /**
     * Parameter name
     * @type {string}
     */
    name: string;
    /**
     * Parameter description
     * @type {string}
     */
    description: string;
    /**
     * Parameter type
     * @type {ChatCommandOptionType}
     */
    type: ChatCommandOptionType;
    /**
     * Whether this parameter is required to complete the request (command)\
     * @type {?boolean}
     */
    required?: boolean;
    /**
     * List of command option choices
     * @remarks
     * {@link type} must be set to *3* in order to implement choices
     * @type {?Array<TextCommandOptionChoiceObject>}
     */
    choices?: TextCommandOptionChoiceObject[];
    /**
     * Discord nested options/parameters
     * @type {?Array<ChatCommandOptionObject>}
     */
    options?: ChatCommandOptionObject[];
}

/**
 * Acceptable CHAT_INPUT command option types (read more [here](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type))
 * @type
 */
export type ChatCommandOptionType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Discord CHAT_INPUT command choice object
 * @interface
 */
export interface TextCommandOptionChoiceObject {
    name: string;
    value: string;
}

/**
 * Context menu command object
 * @interface
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
