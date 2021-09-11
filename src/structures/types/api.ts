export interface BaseCommandObject {
    name: string;
    type: number;
    default_permissions: true;
}

export interface ChatCommandObject extends BaseCommandObject {
    type: 1;
    description: string;
    options?: ChatCommandOptionObject[];
}

export interface ChatCommandOptionObject {
    name: string;
    description: string;
    type: ChatCommandOptionType;
    required?: boolean;
    choices?: TextCommandOptionChoiceObject[];
    options?: ChatCommandOptionObject[];
}

export type ChatCommandOptionType = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface TextCommandOptionChoiceObject {
    name: string;
    value: string;
}

export interface NestedCommandObject extends BaseCommandObject {
    type: 1;
    description: string;
    options: (ChatCommandObject | SubCommandGroupObject)[];
}

export interface SubCommandGroupObject {
    type: 2;
    name: string;
    description: string;
    options: ChatCommandObject[];
}

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
