export interface BaseCommandInit {
    name: string;
    description?: string;
    type: CommandType;
}

export type CommandType = "CHAT" | "MESSAGE" | "USER";
