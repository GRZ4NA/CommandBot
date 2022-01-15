import { BaseCommands, BaseCommandType, ChildCommands, ChildCommandType, Commands, CommandRegExps, CommandType } from "../types/commands";
import { CommandManager } from "../../structures/CommandManager";
import { APICommandObject } from "../../structures/apiTypes";
import { FunctionCommand } from "./FunctionCommand";
import { GuildCommand } from "./GuildCommand";
import { PermissionCommand } from "./PermissionCommand";
import { CommandPermissions } from "../../structures/CommandPermissions";
import { ChatCommand } from "../ChatCommand";
import { SubCommand } from "../SubCommand";

/**
 * Initialization options of core {@link Command} object
 * @interface
 */
export interface APICommandInit {
    /**
     * Command name
     * @type {string}
     */
    name: string;
    /**
     * Discord API default permission
     * @type {?boolean}
     */
    default_permission?: boolean;
}

/**
 * Bot core command object
 * @class
 */
export class Command {
    /**
     * Manager in which this command is registered
     * @type {CommandManager}
     * @public
     * @readonly
     */
    public readonly manager: CommandManager;
    /**
     * Command name
     * @type {string}
     * @public
     * @readonly
     */
    public readonly name: string;
    /**
     * CommandBot's internal command type
     * @type {CommandType}
     * @public
     * @readonly
     */
    public readonly type: CommandType;
    /**
     * Discord API default_permission
     * @type {boolean}
     * @public
     * @readonly
     */
    public readonly default_permission: boolean;

    /**
     * Command core constructor
     * @constructor
     * @param {CommandManager} manager - manager bound to this command
     * @param {CommandType} type - command internal type
     * @param {APICommandInit} options - initialization options
     */
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
     * @returns {APICommandObject} An object that is accepted by the Discord API
     * @public
     */
    public toObject(): APICommandObject {
        return {
            name: this.name,
            default_permission: this.default_permission,
        };
    }
    /**
     * Check base command type
     * @param {BaseCommandType} type - base command type
     * @returns {boolean} Whether this command can be used as the given type
     * @public
     */
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
    /**
     * Checks command type
     * @param {CommandType} type - command type
     * @returns {boolean} Whether this command can be used as the given type
     * @public
     */
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
    /**
     * Check child command type
     * @param {ChildCommandType} type - child command type
     * @returns {boolean} Whether this command can be used as a child command of the given type
     * @public
     */
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
