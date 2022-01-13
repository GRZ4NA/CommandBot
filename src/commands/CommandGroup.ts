import { FunctionCommand } from "./base/FunctionCommand";
import { ChatCommandObject } from "../structures/types/api";
import { CommandManager } from "../structures/CommandManager";
import { ChatCommand, ChatCommandInit } from "./ChatCommand";
import { DEFAULT_BLANK_DESCRIPTION } from "../constants";

export type CommandGroupChildrenType<T extends CommandManager | CommandGroup<CommandManager>> = T extends CommandManager
    ? (ChatCommand | CommandGroup<CommandGroup<CommandManager>>)[]
    : ChatCommand[];

export type CommandGroupInitChildrenType<T extends CommandManager | CommandGroup<CommandManager>> = T extends CommandManager
    ? (ChatCommandInit | CommandGroupInit<CommandGroup<CommandManager>>)[]
    : ChatCommandInit[];

export class CommandGroup<T extends CommandManager | CommandGroup<CommandManager>> extends FunctionCommand {
    /**
     * Parent object
     * @type {CommandManager | CommandGroup}
     * @public
     * @readonly
     */
    public readonly parent: T;
    /**
     * Group description
     * @type {string}
     * @public
     * @readonly
     */
    public readonly description: string;
    /**
     * Children commands
     * @type {CommandGroupChildrenType<T>}
     * @private
     * @readonly
     */
    private readonly _children: CommandGroupChildrenType<T>;

    constructor(parent: T, options: CommandGroupInit<T>) {
        super(parent instanceof CommandManager ? parent : parent.parent, "CHAT", {
            name: options.name,
        });
        this.description = options.description ?? DEFAULT_BLANK_DESCRIPTION;
        this.parent = parent;
        this._children = options.children.map((c) => {
            if (!("children" in c)) {
                return new ChatCommand(this.manager, c);
            } else {
                return new CommandGroup(this as CommandGroup<CommandManager>, c);
            }
        }) as CommandGroupChildrenType<T>;
    }

    public toObject(): ChatCommandObject {
        return {
            ...super.toObject(),
            description: this.description,
            type: 1,
            options: this._children.map((c) => {
                return {
                    name: c.name,
                    description: c.description,
                    type: c instanceof ChatCommand ? 1 : 2,
                };
            }),
        };
    }
}

/**
 * Initialization options for CommandGroup
 * @interface
 */
export interface CommandGroupInit<T extends CommandManager | CommandGroup<CommandManager>> {
    /**
     * Group name
     * @type {string}
     */
    name: string;
    /**
     * Children commands
     * @type {CommandGroupInitChildrenType<T>}
     */
    children: CommandGroupInitChildrenType<T>;
    /**
     * Group description
     * @type {?string}
     */
    description?: string;
}
