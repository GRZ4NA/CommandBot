import { CommandRegExps } from "../types/commands.js";
import { APICommandType } from "../../structures/types/api.js";
import { CommandManager } from "../../structures/CommandManager";
import { APICommandObject } from "../../structures/types/api";
import { APICommandInit } from "../types/InitOptions.js";
import { FunctionCommand } from "./FunctionCommand.js";
import { GuildCommand } from "./GuildCommand.js";
import { PermissionCommand } from "./PermissionCommand.js";
import { CommandPermissions } from "../../structures/CommandPermissions.js";
import { PermissionGuildCommand } from "./PermissionGuildCommand.js";
import { ChatCommand } from "../ChatCommand.js";
import { ContextMenuCommand } from "../ContextMenuCommand.js";
import { SubCommand } from "../SubCommand.js";
import { SubCommandGroup } from "../SubCommandGroup.js";
import { NestedCommand } from "../NestedCommand.js";

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

    public isFunctionCommand(): this is FunctionCommand {
        return (
            "announceSuccess" in this && "start" in this && typeof (this as FunctionCommand).announceSuccess === "boolean" && (this as FunctionCommand).start instanceof Function
        );
    }

    public isGuildCommand(): this is GuildCommand {
        return this.isFunctionCommand() && "dm" in this && typeof (this as GuildCommand).dm === "boolean";
    }

    public isPermissionCommand(): this is PermissionCommand {
        return this.isFunctionCommand() && "permissions" in this && (this as PermissionCommand).permissions instanceof CommandPermissions;
    }

    public isPermissionGuildCommand(): this is PermissionGuildCommand {
        return (
            this.isFunctionCommand() &&
            "dm" in this &&
            typeof (this as GuildCommand).dm === "boolean" &&
            "permissions" in this &&
            (this as PermissionCommand).permissions instanceof CommandPermissions
        );
    }

    public isChatCommand(): this is ChatCommand {
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
    }

    public isContextMenuCommand(): this is ContextMenuCommand {
        return (this.type === "MESSAGE" || this.type === "USER") && this.isPermissionGuildCommand();
    }

    public isNestedCommand(): this is NestedCommand {
        return (
            this.type === "CHAT_INPUT" &&
            "description" in this &&
            !("parameters" in this) &&
            !("visible" in this) &&
            !("slash" in this) &&
            "getSubcommand" in this &&
            "fetchSubcommand" in this
        );
    }

    public isSubCommand(): this is SubCommand {
        return (
            this.type === "CHAT_INPUT" &&
            "description" in this &&
            typeof (this as SubCommand).description === "string" &&
            "parameters" in this &&
            Array.isArray((this as SubCommand).parameters)
        );
    }

    public isSubCommandGroup(): this is SubCommandGroup {
        return this.type === "CHAT_INPUT" && "description" in this && !("parameters" in this) && !("visible" in this) && !("slash" in this);
    }
}
