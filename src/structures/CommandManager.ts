import axios, { AxiosResponse } from "axios";
import { Guild, Interaction, Message } from "discord.js";
import { InputParameter, ObjectID, TargetID } from "./Parameter.js";
import { CommandNotFound } from "../errors.js";
import { applicationState } from "../state.js";
import { ChatCommand, ChatCommandInit } from "../commands/ChatCommand.js";
import { ContextMenuCommand, ContextMenuCommandInit } from "../commands/ContextMenuCommand.js";
import { Commands, CommandInit, CommandRegExps, CommandType } from "../commands/commandsTypes.js";
import { APICommandObject, CommandPermission, RegisteredCommandObject, APICommandType } from "./apiTypes.js";
import { Bot } from "./Bot.js";
import { SubCommand } from "../commands/SubCommand.js";
import { SubCommandGroup } from "../commands/SubCommandGroup.js";
import { HelpMessageParams } from "../commands/Help.js";
import { HelpMessage } from "../commands/Help.js";
import { PrefixManager } from "./PrefixManager.js";
import { Command } from "../commands/base/Command.js";
import { InputManager } from "./InputManager.js";

/**
 * Object that stores the registered commands and is responsible for data exchanging with the Discord API
 * @class
 */
export class CommandManager {
    /**
     * List of commands registered in the manager
     * @type {Array<Command>}
     * @private
     * @readonly
     */
    private readonly _commands: Command[] = [];
    /**
     * Cache of Discord API commands data
     * @type {Map<string, Map<string, RegisteredCommandObject>>}
     * @private
     * @readonly
     */
    private readonly _registerCache: Map<string, Map<string, RegisteredCommandObject>> = new Map();
    private readonly _globalEntryName: string = "global";
    /**
     * Client connected to this manager
     * @type {Client}
     * @public
     * @readonly
     */
    public readonly client: Bot;
    /**
     * Help command associated with this manager
     * @type {?HelpMessage}
     * @public
     * @readonly
     */
    public readonly help?: HelpMessage;
    /**
     * A manager holding all guild-specific prefixes and a global prefix
     * @type {string}
     * @public
     * @readonly
     */
    public readonly prefix: PrefixManager;
    /**
     * A string used to split all incoming input data from Discord messages
     * @type {string}
     * @public
     * @readonly
     */
    public readonly argumentSeparator: string;
    /**
     * A string used to separate subcommand groups and subcommands
     * @type {string}
     * @public
     * @readonly
     */
    public readonly commandSeparator: string;
    /**
     * Discord API URL
     * @type {string}
     * @public
     * @static
     * @readonly
     */
    public static readonly baseApiUrl: string = "https://discord.com/api/v8";

    /**
     *
     * @constructor
     * @param {Bot} client - client that this manager belongs to
     * @param {HelpMessageParams} helpMsg - parameters defining appearance of the help message
     * @param {?string} [prefix] - prefix used to respond to message interactions
     * @param {?string} [argSep=','] - a string used to split all incoming input data from Discord messages
     * @param {?string} [cmdSep='/'] - a string used to separate subcommand groups and subcommands
     */
    constructor(client: Bot, helpMsg: HelpMessageParams, prefix?: string, argSep?: string, cmdSep?: string) {
        if ((argSep && !CommandRegExps.separator.test(argSep)) || (cmdSep && !CommandRegExps.separator.test(cmdSep))) {
            throw new Error("Incorrect separators");
        }
        this.client = client;
        this.prefix = new PrefixManager(this, prefix);
        this.argumentSeparator = argSep || ",";
        this.commandSeparator = cmdSep || "/";
        if (this.commandSeparator === this.argumentSeparator) {
            throw new Error("Command separator and argument separator have the same value");
        }
        if (helpMsg.enabled === true) {
            this.help = new HelpMessage(this, helpMsg);
            this._commands.push(this.help);
        }
    }

    /**
     * Discord API commands cache
     * @type {Map<string, Map<string, RegisteredCommandObject>>}
     */
    get cache(): Readonly<Map<string, Map<string, RegisteredCommandObject>>> {
        return this._registerCache;
    }
    /**
     * Number of commands registered in this manager
     * @type {number}
     */
    get commandsCount(): Readonly<number> {
        return this._commands.length;
    }

    /**
     * Creates and registers command in the manager based on the given options
     * @param {T} type - a type of command that will be created and added to this manager
     * @param {CommandInit<T>} options - an object containing all properties required to create this type of command
     * @returns {Commands<T>} A computed command object that inherits from {@link Command}
     * @public
     * @remarks All commands have to be added to the instance **before starting the bot**. Adding commands while the bot is running is not possible and can cause issues.
     *
     * Command types
     * - [CHAT](https://grz4na.github.io/commandbot-docs/interfaces/ChatCommandInit.html) - message interactions using command prefixes or slash commands
     * - [USER](https://grz4na.github.io/commandbot-docs/interfaces/ContextMenuCommandInit.html) - right-click context menu interactions on users
     * - [MESSAGE](https://grz4na.github.io/commandbot-docs/interfaces/ContextMenuCommandInit.html) - right-click context menu interactions on messages
     */
    public add<T extends CommandType>(type: T, options: CommandInit<T>): Commands<T> {
        const command: Commands<T> | null =
            type === "CHAT"
                ? (new ChatCommand(this, options as ChatCommandInit) as Commands<T>)
                : type === "CONTEXT"
                ? (new ContextMenuCommand(this, options as ContextMenuCommandInit) as Commands<T>)
                : null;
        if (!command) {
            throw new TypeError("Incorrect command type");
        }
        if (applicationState.running) {
            console.warn(`[❌ ERROR] Cannot add command "${command.name}" while the application is running.`);
            return command;
        }
        if (command instanceof SubCommand || command instanceof SubCommandGroup) {
            throw new Error(
                "Registering subcommands and subcommand groups through the 'add' method is not allowed. Use NestedCommand.append or SubCommandGroup.append to register."
            );
        }
        this._commands.push(command);
        return command;
    }
    /**
     * Get command registered in this manager
     * @param {string} q - command name or alias
     * @param {?APICommandType} [t] - type of command you want to get from this manager (if *undefined* searches in all registered commands)
     * @returns {?Command} A command object
     * @public
     */
    public get<T extends CommandType>(q: string, t?: T): (T extends "CHAT" ? Commands<T> | SubCommand : Commands<T>) | null {
        switch (t) {
            case "CHAT":
                const cmdList = this.list(t);
                return (
                    (cmdList.find((c) => c.name === q || (c.aliases && c.aliases.length > 0 && c.aliases.find((a) => a === q))) as T extends "CHAT"
                        ? Commands<T> | SubCommand
                        : Commands<T>) ??
                    cmdList
                        .filter((c) => c.hasSubCommands)
                        .map((c) =>
                            c.children.map((ch) => {
                                if (ch instanceof SubCommand) return ch;
                                else return ch.children;
                            })
                        )
                        .flat(2)
                        .find((c) => c.aliases?.find((a) => a === q)) ??
                    null
                );
            case "NESTED":
                return (this.list(t).find((c) => c.name === q) || null) as T extends "CHAT" ? Commands<T> | SubCommand : Commands<T>;
            case "CONTEXT":
                return (this.list(t).find((c) => c.name === q) as T extends "CHAT" ? Commands<T> | SubCommand : Commands<T>) || null;
            default:
                return (this.list().find((c) => c.name === q) as T extends "CHAT" ? Commands<T> | SubCommand : Commands<T>) || null;
        }
    }
    /**
     * Fetches command object from the Discord API
     * @param {string} id - Discord command ID
     * @param {?Guild | string} [guild] - ID of guild that this command belongs to
     * @param {?boolean} [noCache=false] - whether not to use cached data
     * @returns {Promise<RegisteredCommandObject>} Discord command object
     * @public
     * @async
     */
    public async getApi(id: string, guild?: Guild | string, noCache?: boolean): Promise<RegisteredCommandObject> {
        const guildId = guild instanceof Guild ? guild.id : guild;
        if (!noCache) {
            const rqC = this.getCache(id, guildId);
            if (rqC) return rqC;
        }
        let rq: AxiosResponse<RegisteredCommandObject>;
        if (guildId) {
            rq = await axios.get(`${CommandManager.baseApiUrl}/applications/${this.client.applicationId}/guilds/${guildId}/commands/${id}`, {
                headers: { Authorization: `Bot ${this.client.token}` },
            });
        } else {
            rq = await axios.get(`${CommandManager.baseApiUrl}/applications/${this.client.applicationId}/commands/${id}`, {
                headers: { Authorization: `Bot ${this.client.token}` },
            });
        }
        if (rq.status === 200) {
            this.updateCache(rq.data);
            return rq.data as RegisteredCommandObject;
        } else {
            throw new Error(`HTTP request failed with code ${rq.status}: ${rq.statusText}`);
        }
    }
    /**
     * Fetches command ID by name from the Discord APi
     * @param {string} name - name of the command
     * @param {string} type - command type you want to get ID for
     * @param {?string} [guild] - ID of guild that this command belongs to
     * @returns {string} Command ID from the Discord API
     * @public
     * @async
     */
    public async getIdApi(name: string, type: APICommandType, guild?: Guild | string): Promise<string | null> {
        let map: Map<string, RegisteredCommandObject> = await this.listApi(guild);
        let result: string | null = null;
        map?.forEach((c) => {
            const typeC: APICommandType = c.type === 1 ? "CHAT_INPUT" : c.type === 2 ? "USER" : "MESSAGE";
            if (c.name === name && typeC === type) {
                result = c.id;
            }
        });
        return result;
    }
    /**
     * Lists all commands in the manager
     * @param {APICommandType} [f] - filter, type of commands to return in the list
     * @returns {Array<Command>} An array of commands registered in this manager
     * @public
     */
    public list(): readonly Command[];
    public list(f: "CHAT"): readonly ChatCommand[];
    public list(f: "CONTEXT"): readonly ContextMenuCommand[];
    public list(f?: CommandType): readonly Command[] {
        switch (f) {
            case "CHAT":
                return Object.freeze([...this._commands.filter((c) => c.type === "CHAT")]);
            case "CONTEXT":
                return Object.freeze([...this._commands.filter((c) => c.type === "CONTEXT")]);
            default:
                return Object.freeze([...this._commands]);
        }
    }
    /**
     * Lists commands registered in the Discord API
     * @param {Guild | string} [g] - Guild object or ID
     * @returns {Promise<Map<string, RegisteredCommandObject>>} List of commands from Discord API
     * @public
     * @async
     */
    public async listApi(g?: Guild | string): Promise<Map<string, RegisteredCommandObject>> {
        const guildId = g instanceof Guild ? g.id : g;
        let rq: AxiosResponse<RegisteredCommandObject[]>;
        if (guildId) {
            rq = await axios.get(`${CommandManager.baseApiUrl}/applications/${this.client.applicationId}/guilds/${guildId}/commands`, {
                headers: { Authorization: `Bot ${this.client.token}` },
            });
        } else {
            rq = await axios.get(`${CommandManager.baseApiUrl}/applications/${this.client.applicationId}/commands`, {
                headers: { Authorization: `Bot ${this.client.token}` },
            });
        }
        if (rq.status === 200) {
            this.updateCache(rq.data, guildId);
            return this.arrayToMap(rq.data);
        } else {
            throw new Error(`HTTP request failed with code ${rq.status}: ${rq.statusText}`);
        }
    }
    /**
     * Process an interaction
     * @param {Interaction | Message} i - interaction object to fetch a command from
     * @returns {?InputManager} An InputManager containing all input data (command, arguments, target etc.)
     * @public
     */
    public fetch(i: Interaction | Message): InputManager | null {
        const prefix = this.prefix.get(i.guild || undefined);
        if (i instanceof Interaction) {
            if (i.isCommand()) {
                const cmd = this.get(i.commandName, "CHAT");
                if (cmd instanceof ChatCommand) {
                    if (cmd.hasSubCommands) {
                        const subCmd = cmd.fetchSubcommand([...i.options.data], i);
                        if (subCmd) return subCmd;
                    }
                    return new InputManager(
                        cmd,
                        i,
                        cmd.parameters.map((p, index) => {
                            if (p.type === "user" || p.type === "role" || p.type === "channel" || p.type === "mentionable") {
                                return new InputParameter(p, new ObjectID(i.options.data[index]?.value?.toString() ?? "", p.type, i.guild ?? undefined));
                            } else {
                                return new InputParameter(p, i.options.data[index]?.value ?? null);
                            }
                        })
                    );
                } else {
                    throw new CommandNotFound(i.commandName);
                }
            } else if (i.isContextMenu()) {
                const cmd = this.get(i.commandName, "CONTEXT");
                if (cmd) {
                    const target = new TargetID(i.targetId, i.targetType, i);
                    return new InputManager(cmd, i, [], target);
                } else {
                    throw new CommandNotFound(i.commandName);
                }
            } else {
                return null;
            }
        } else if (prefix && i instanceof Message) {
            if (i.content.startsWith(prefix)) {
                if (i.content === prefix) return null;
                const cmdName = i.content.replace(prefix, "").split(" ")[0].split(this.commandSeparator)[0];
                const cmd = this.get(cmdName, "CHAT");
                if (cmd instanceof ChatCommand) {
                    const argsRaw = i.content
                        .replace(`${prefix}${cmdName}`, "")
                        .split(this.argumentSeparator)
                        .map((a) => {
                            if (a.startsWith(" ")) {
                                return a.replace(" ", "");
                            } else {
                                return a;
                            }
                        });
                    if (cmd.hasSubCommands) {
                        const nesting = i.content.split(" ")[0].replace(`${prefix}${cmdName}${this.commandSeparator}`, "").split(this.commandSeparator);
                        const subCmd = cmd.getSubcommand(nesting[1] ? nesting[1] : nesting[0], nesting[1] ? nesting[0] : undefined);
                        if (subCmd) {
                            const subArgsRaw = i.content
                                .replace(`${prefix}${cmdName}${this.commandSeparator}${nesting.join(this.commandSeparator)}`, "")
                                .split(this.argumentSeparator)
                                .map((a) => {
                                    if (a.startsWith(" ")) {
                                        return a.replace(" ", "");
                                    } else {
                                        return a;
                                    }
                                });
                            return new InputManager(
                                subCmd,
                                i,
                                subCmd.parameters.map((p, index) => {
                                    if (p.type === "user" || p.type === "role" || p.type === "channel" || p.type === "mentionable") {
                                        return new InputParameter(p, new ObjectID(subArgsRaw[index] ?? "", p.type, i.guild ?? undefined));
                                    } else {
                                        return new InputParameter(p, subArgsRaw[index] ?? null);
                                    }
                                })
                            );
                        }
                    }
                    return new InputManager(
                        cmd,
                        i,
                        cmd.parameters.map((p, index) => {
                            if (p.type === "user" || p.type === "role" || p.type === "channel" || p.type === "mentionable") {
                                return new InputParameter(p, new ObjectID(argsRaw[index], p.type, i.guild ?? undefined));
                            } else {
                                return new InputParameter(p, argsRaw[index]);
                            }
                        })
                    );
                } else if (cmd instanceof SubCommand) {
                    const subArgsRaw = i.content
                        .replace(`${prefix}${cmdName}`, "")
                        .split(this.argumentSeparator)
                        .map((a) => {
                            if (a.startsWith(" ")) {
                                return a.replace(" ", "");
                            } else {
                                return a;
                            }
                        });
                    return new InputManager(
                        cmd,
                        i,
                        cmd.parameters.map((p, index) => {
                            if (p.type === "user" || p.type === "role" || p.type === "channel" || p.type === "mentionable") {
                                return new InputParameter(p, new ObjectID(subArgsRaw[index] ?? "", p.type, i.guild ?? undefined));
                            } else {
                                return new InputParameter(p, subArgsRaw[index] ?? null);
                            }
                        })
                    );
                } else {
                    throw new CommandNotFound(cmdName);
                }
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
    /**
     * Register all commands in this manager in the Discord API
     * @returns {Promise<void>}
     * @public
     * @async
     */
    public async register(): Promise<void> {
        const globalCommands = this._commands
            .filter((c) => {
                if (c.isBaseCommandType("GUILD") && (!Array.isArray(c.guilds) || c.guilds.length === 0)) {
                    if (c.isCommandType("CHAT") && c.slash === false) {
                        return false;
                    } else {
                        return true;
                    }
                }
            })
            .map((c) => c.toObject());
        const guildCommands: Map<string, APICommandObject[]> = new Map();
        this._commands
            .filter((c) => c.isBaseCommandType("GUILD") && Array.isArray(c.guilds) && c.guilds.length > 0)
            .map((c) => {
                c.isBaseCommandType("GUILD") &&
                    c.guilds?.map((gId) => {
                        if (!this.client.client.guilds.cache.get(gId)) {
                            throw new Error(`"${gId}" is not a valid ID for this client.`);
                        }
                        const existingEntry = guildCommands.get(gId);
                        if (!existingEntry) {
                            guildCommands.set(gId, [c.toObject()]);
                        } else {
                            guildCommands.set(gId, [...existingEntry, c.toObject()]);
                        }
                    });
            });
        await axios
            .put(`${CommandManager.baseApiUrl}/applications/${this.client.applicationId}/commands`, globalCommands, {
                headers: { Authorization: `Bot ${this.client.token}` },
            })
            .then((r) => {
                if (r.status === 429) {
                    console.error("[❌ ERROR] Failed to register application commands. You are being rate limited.");
                }
            })
            .catch((e) => console.error(e));
        await guildCommands.forEach(async (g, k) => {
            await axios
                .put(`${CommandManager.baseApiUrl}/applications/${this.client.applicationId}/guilds/${k}/commands`, g, {
                    headers: { Authorization: `Bot ${this.client.token}` },
                })
                .then((r) => {
                    if (r.status === 429) {
                        console.error(`[❌ ERROR] Failed to register application commands for guild ${k}. You are being rate limited.`);
                    }
                })
                .catch((e) => console.error(e));
        });
    }
    /**
     * Set permissions using Discord Permissions API
     * @param {string} id - command ID
     * @param {CommandPermission[]} permissions - permissions to set
     * @param {Guild | string} [g] - Guild ID or object (if command is in a guild)
     * @returns {Promise<void>}
     * @public
     * @async
     * @experimental This functionality hasn't been polished and fully tested yet. Using it might lead to errors and application crashes.
     */
    public async setPermissionsApi(id: string, permissions: CommandPermission[], g?: Guild | string) {
        if (typeof g === "string" && !this.client.client.guilds.cache.get(g)) throw new Error(`${g} is not a valid guild id`);
        const response = await axios.put(
            `${CommandManager.baseApiUrl}/applications/${this.client.applicationId}/${g ? (g instanceof Guild ? `guilds/${g.id}` : g) : ""}commands/${id}/permissions`,
            {
                permissions: permissions,
            },
            {
                headers: {
                    Authorization: `Bot ${this.client.token}`,
                },
            }
        );
        if (response.status !== 200) {
            throw new Error(`HTTP request failed with code ${response.status}: ${response.statusText}`);
        }
    }
    /**
     * Get permissions from Discord Permissions API for a specified command
     * @param {string} id - command ID
     * @param {Guild | string} [g] - Guild ID or object (if command is in a guild)
     * @public
     * @async
     * @experimental This functionality hasn't been polished and fully tested yet. Using it might lead to errors and application crashes.
     */
    public async getPermissionsApi(id: string, g?: Guild | string) {
        if (typeof g === "string" && !this.client.client.guilds.cache.get(g)) throw new Error(`${g} is not a valid guild id`);
        const response = await axios.get(
            `${CommandManager.baseApiUrl}/applications/${this.client.applicationId}/${g ? (g instanceof Guild ? `guilds/${g.id}` : g) : ""}commands/${id}/permissions`,
            {
                headers: {
                    Authorization: `Bot ${this.client.token}`,
                },
            }
        );
        if (response.status !== 200) {
            throw new Error(`HTTP request failed with code ${response.status}: ${response.statusText}`);
        }
        return response.data as CommandPermission[];
    }
    /**
     *
     * @param {Array<RegisteredCommandObject>} commands - list of commands to cache
     * @param {?string} guildId - guild ID
     * @returns {void}
     * @private
     */
    private updateCache(commands: RegisteredCommandObject[] | RegisteredCommandObject, guildId?: string): void {
        if (Array.isArray(commands)) {
            this._registerCache.set(guildId || this._globalEntryName, this.arrayToMap(commands));
            return;
        } else {
            this._registerCache.get(guildId || this._globalEntryName)?.set(commands.id, commands);
        }
    }
    /**
     * Retrieves cache from the manager
     * @param {string} q
     * @param {?string} guildId
     * @returns {?RegisteredCommandObject}
     */
    private getCache(q: string, guildId?: string): RegisteredCommandObject | null {
        return this._registerCache.get(guildId || this._globalEntryName)?.get(q) || null;
    }
    /**
     * Performs internal data type conversions
     * @param {Array<RegisteredCommandObject>} a
     * @returns {Map<string, RegisteredCommandObject>}
     */
    private arrayToMap(a: RegisteredCommandObject[]): Map<string, RegisteredCommandObject> {
        const map: Map<string, RegisteredCommandObject> = new Map();
        a.map((rc) => {
            map.set(rc.id, rc);
        });
        return map;
    }
    /**
     * @param {any} c - object to check
     * @returns {boolean} Whether this object is a {@link Command} object
     * @public
     * @static
     */
    public static isCommand(c: any): c is Command {
        return "name" in c && "type" in c && "default_permission" in c && ((c as Command).type === "CHAT" || (c as Command).type === "CONTEXT");
    }
}
