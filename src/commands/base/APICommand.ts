import { BaseCommand, BaseCommandType, ChildCommand, ChildCommandType, Command, CommandRegExps, CommandType } from "../types/commands.js";
import { APICommandType } from "../../structures/types/api.js";
import { CommandManager } from "../../structures/CommandManager.js";
import { APICommandObject } from "../../structures/types/api.js";
import { APICommandInit } from "../types/InitOptions.js";
import { FunctionCommand } from "./FunctionCommand.js";
import { GuildCommand } from "./GuildCommand.js";
import { PermissionCommand } from "./PermissionCommand.js";
import { CommandPermissions } from "../../structures/CommandPermissions.js";
import { ChatCommand } from "../ChatCommand.js";
import { SubCommand } from "../SubCommand.js";

export class APICommand {
    protected readonly _manager: CommandManager;
    public readonly name: string;
    public readonly type: APICommandType;
    public readonly default_permission: boolean;

    constructor(manager: CommandManager, type: APICommandType, options: APICommandInit) {
        this._manager = manager;
        this.name = options.name;
        this.type = type;
        this.default_permission = options.default_permission ?? true;

        if (!CommandRegExps.baseName.test(this.name)) {
            throw new Error(`"${this.name}" is not a valid command name`);
        }
    }

    get manager(): CommandManager {
        return this._manager;
    }

    /**
     * Converts a command instance to an {@link APICommandObject}
     * @return {APICommandObject} An object that is accepted by the Discord API
     */
    public toObject(): APICommandObject {
        return {
            name: this.name,
            type: this.type === "MESSAGE" ? 3 : this.type === "USER" ? 2 : 1,
            default_permission: this.default_permission,
        };
    }

    public isBaseCommandType<T extends BaseCommandType>(type: T): this is BaseCommand<T> {
        switch (type) {
            case "API":
                return (
                    "name" in this &&
                    "type" in this &&
                    "default_permission" in this &&
                    typeof (this as APICommand).name === "string" &&
                    ((this as APICommand).type === "CHAT_INPUT" || (this as APICommand).type === "MESSAGE" || (this as APICommand).type === "USER")
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

    public isCommandType<T extends CommandType>(type: T): this is Command<T> {
        switch (type) {
            case "CHAT_INPUT":
                return (
                    this.type === "CHAT_INPUT" &&
                    "parameters" in this &&
                    Array.isArray((this as ChatCommand).parameters) &&
                    "description" in this &&
                    typeof (this as ChatCommand).description === "string" &&
                    "visible" in this &&
                    typeof (this as ChatCommand).visible === "boolean" &&
                    "slash" in this &&
                    typeof (this as ChatCommand).slash === "boolean"
                );
            case "MESSAGE":
            case "USER":
                return (this.type === "MESSAGE" || this.type === "USER") && this.isBaseCommandType("PERMISSIONGUILD");
            case "NESTED":
                return (
                    this.type === "CHAT_INPUT" &&
                    "description" in this &&
                    !("parameters" in this) &&
                    !("visible" in this) &&
                    !("slash" in this) &&
                    "getSubcommand" in this &&
                    "fetchSubcommand" in this
                );
            default:
                return false;
        }
    }

    public isChildCommandType<T extends ChildCommandType>(type: T): this is ChildCommand<T> {
        switch (type) {
            case "COMMAND":
                return (
                    this.type === "CHAT_INPUT" &&
                    "description" in this &&
                    typeof (this as SubCommand).description === "string" &&
                    "parameters" in this &&
                    Array.isArray((this as SubCommand).parameters)
                );
            case "GROUP":
                return this.type === "CHAT_INPUT" && "description" in this && !("parameters" in this) && !("visible" in this) && !("slash" in this);
            default:
                return false;
        }
    }
}
