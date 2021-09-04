export interface BaseCommandInit {
    name: string;
    type: CommandType;
}

export type CommandType = "CHAT" | "MESSAGE" | "USER";
