export interface BaseCommandObject {
    name: string;
    type: number;
    default_permissions: true;
}

export interface TextCommandObject extends BaseCommandObject {
    description: string;
    options?: TextCommandOptionObject[];
}

export interface TextCommandOptionObject {
    name: string;
    description: string;
    type: number;
    required?: boolean;
    choices?: TextCommandOptionChoiceObject[];
    options?: TextCommandOptionObject[];
}

export interface TextCommandOptionChoiceObject {
    name: string;
    value: string;
}
