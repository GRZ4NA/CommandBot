import { BaseCommandInit } from "./BaseCommand.js";

export type ContextType = "MESSAGE" | "USER";

export interface ContextMenuCommandInit extends BaseCommandInit {
    contextType: ContextType;
}
