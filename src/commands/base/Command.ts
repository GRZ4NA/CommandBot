import { BaseCommands, BaseCommandType, ChildCommands, ChildCommandType, Commands, CommandRegExps, CommandType } from "../types/commands.js";
import { CommandManager } from "../../structures/CommandManager.js";
import { APICommandObject } from "../../structures/types/api.js";
import { APICommandInit } from "../types/InitOptions.js";
import { FunctionCommand } from "./FunctionCommand.js";
import { GuildCommand } from "./GuildCommand.js";
import { PermissionCommand } from "./PermissionCommand.js";
import { CommandPermissions } from "../../structures/CommandPermissions.js";
import { ChatCommand } from "../ChatCommand.js";
import { SubCommand } from "../SubCommand.js";

export class Command {
    public readonly manager: CommandManager;
    public readonly name: string;
    public readonly type: CommandType;
    public readonly default_permission: boolean;

    constructor(manager: CommandManager, type: CommandType, options: APICommandInit) {
        this.manager = manager;
        this.name = options.name;
        this.type = type;
        this.default_permission = options.default_permission ?? true;

        if (!CommandRegExps.baseName.test(this.name)) {
            throw new Error(`"${this.name}" is not a valid command name`);
        }
        if (this.manager.get(this.name, this.type)) {
            throw new Error(`A command with name "${this.name}" is already registered in the manager.`);
        }
    }

    /**
     * Converts a command instance to an {@link APICommandObject}
     * @return {APICommandObject} An object that is accepted by the Discord API
     */
    public toObject(): APICommandObject {
        return {
            name: this.name,
            default_permission: this.default_permission,
        };
    }

    public isBaseCommandType<T extends BaseCommandType>(type: T): this is BaseCommands<T> {
        switch (type) {
            case "BASE":
                return (
                    "name" in this &&
                    "type" in this &&
                    "default_permission" in this &&
                    typeof (this as Command).name === "string" &&
                    ((this as Command).type === "CHAT" || (this as Command).type === "CONTEXT")
                );
            case "FUNCTION":
                return (
                    "announceSuccess" in this &&
                    "start" in this &&
                    typeof (this as FunctionCommand).announceSuccess === "boolean" &&
                    (this as FunctionCommand).start instanceof Function
                );
            case "GUILD":
                return this.isBaseCommandType("FUNCTION") && "dm" in this && typeof (this as GuildCommand).dm === "boolean";
            case "PERMISSION":
                return this.isBaseCommandType("FUNCTION") && "permissions" in this && (this as PermissionCommand).permissions instanceof CommandPermissions;
            case "PERMISSIONGUILD":
                return (
                    this.isBaseCommandType("FUNCTION") &&
                    "dm" in this &&
                    typeof (this as GuildCommand).dm === "boolean" &&
                    "permissions" in this &&
                    (this as PermissionCommand).permissions instanceof CommandPermissions
                );
            default:
                return false;
        }
    }

    public isCommandType<T extends CommandType>(type: T): this is Commands<T> {
        switch (type) {
            case "CHAT":
                return (
                    this.type === "CHAT" &&
                    "parameters" in this &&
                    Array.isArray((this as ChatCommand).parameters) &&
                    "description" in this &&
                    typeof (this as ChatCommand).description === "string" &&
                    "visible" in this &&
                    typeof (this as ChatCommand).visible === "boolean" &&
                    "slash" in this &&
                    typeof (this as ChatCommand).slash === "boolean"
                );
            case "CONTEXT":
                return this.type === "CONTEXT" && this.isBaseCommandType("PERMISSIONGUILD");
            default:
                return false;
        }
    }

    public isChildCommandType<T extends ChildCommandType>(type: T): this is ChildCommands<T> {
        switch (type) {
            case "COMMAND":
                return (
                    this.type === "CHAT" &&
                    "description" in this &&
                    typeof (this as SubCommand).description === "string" &&
                    "parameters" in this &&
                    Array.isArray((this as SubCommand).parameters)
                );
            case "GROUP":
                return this.type === "CHAT" && "description" in this && !("parameters" in this) && !("visible" in this) && !("slash" in this);
            default:
                return false;
        }
    }
}
