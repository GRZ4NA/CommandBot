import axios, { AxiosResponse } from "axios";
import { Guild, Interaction, Message } from "discord.js";
import { TargetID } from "../structures/parameter.js";
import { CommandNotFound } from "../errors.js";
import { applicationState } from "../state.js";
import { BaseCommand } from "./BaseCommand.js";
import { ChatCommand } from "./ChatCommand.js";
import { ContextMenuCommand } from "./ContextMenuCommand.js";
import { Command, CommandInit, CommandRegExps, CommandType } from "./types/commands.js";
import { CommandInteractionData } from "./types/commands.js";
import { BaseCommandObject, RegisteredCommandObject } from "../structures/types/api.js";
import { Bot } from "../structures/Bot.js";
import { SubCommand } from "./SubCommand.js";
import { SubCommandGroup } from "./SubCommandGroup.js";
import { NestedCommand } from "./NestedCommand.js";
import { ChatCommandInit } from "./types/ChatCommand.js";
import { NestedCommandInit } from "./types/NestedCommand.js";
import { ContextMenuCommandInit } from "./types/ContextMenuCommand.js";
import { HelpMessageParams } from "./types/HelpMessage.js";
import { HelpMessage } from "./Help.js";
import { PrefixManager } from "./PrefixManager.js";

export class CommandManager {
    private readonly _client: Bot;
    private readonly _commands: BaseCommand[] = [];
    private readonly _registerCache: Map<string, Map<string, RegisteredCommandObject>> = new Map();
    private readonly _globalEntryName: string = "global";

    /**
     * Prefix used to respond to message interactions
     * @type {string}
     */
    public readonly prefix: PrefixManager;

    /**
     * A string used to split all incoming input data from Discord messages
     * @type {string}
     */
    public readonly argumentSeparator: string;

    /**
     * A string used to separate subcommand groups and subcommands
     * @type {string}
     */
    public readonly commandSeparator: string;

    /**
     * Discord API URL
     * @type {string}
     */
    public static readonly baseApiUrl: string = "https://discord.com/api/v8";

    /**
     *
     * @param {Bot} client - client that this manager belongs to
     * @param {HelpMessageParams} helpMsg - parameters defining appearance of the help message
     * @param {string} prefix - prefix used to respond to message interactions
     * @param {string} argSep - a string used to split all incoming input data from Discord messages
     * @param {string} cmdSep - a string used to separate subcommand groups and subcommands
     */
    constructor(client: Bot, helpMsg: HelpMessageParams, prefix?: string, argSep?: string, cmdSep?: string) {
        if ((argSep && !CommandRegExps.separator.test(argSep)) || (cmdSep && !CommandRegExps.separator.test(cmdSep))) {
            throw new Error("Incorrect separators");
        }
        this._client = client;
        this.prefix = new PrefixManager(this, prefix);
        this.argumentSeparator = argSep || ",";
        this.commandSeparator = cmdSep || "/";
        if (this.commandSeparator === this.argumentSeparator) {
            throw new Error("Command separator and argument separator have the same value");
        }
        if (helpMsg.enabled === true) {
            this._commands.push(new HelpMessage(this, helpMsg));
        }
    }

    /**
     * @returns {Bot} A {@link Bot} object that this manager belongs to
     */
    get client() {
        return this._client;
    }

    /**
     *
     * @param {CommandType} type - a type of command that will be created and added to this manager
     * @param {CommandInit} options - an object containing all properties required to create this type of command
     * @returns {Command} A computed command object that inherits from {@link BaseCommand}
     */
    public add<T extends CommandType>(type: T, options: CommandInit<T>): Command<T> {
        const command: Command<T> | null =
            type === "CHAT"
                ? (new ChatCommand(this, options as ChatCommandInit) as Command<T>)
                : type === "NESTED"
                ? (new NestedCommand(this, options as NestedCommandInit) as Command<T>)
                : type === "CONTEXT"
                ? (new ContextMenuCommand(this, options as ContextMenuCommandInit) as Command<T>)
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
        if (command.isCommandType("CHAT")) {
            if (this.list("CHAT").find((c) => c.name === command.name)) {
                console.error(`[❌ ERROR] Cannot add command "${command.name}" because this name has already been registered as a ChatCommand in this manager.`);
                return command;
            }
            command.aliases &&
                command.aliases.length > 0 &&
                command.aliases.map((a, i, ar) => {
                    const r = this.get(a, "CHAT");
                    if (r) {
                        console.warn(
                            `[⚠️ WARNING] Cannot register alias "${a}" because its name is already being used in other command. Command "${command.name}" will be registered without this alias.`
                        );
                        ar.splice(i, 1);
                    }
                });
            this._commands.push(command);
            return command;
        } else if (command.isCommandType("CONTEXT")) {
            if (this.list("CONTEXT").find((c) => c.name === command.name)) {
                console.error(`[❌ ERROR] Cannot add command "${command.name}" because this name has already been registered as a ContextMenuCommand in this manager.`);
                return command;
            }
            this._commands.push(command);
            return command;
        } else if (command.isCommandType("NESTED")) {
            if (this.list("CHAT").find((c) => c.name === command.name)) {
                console.error(`[❌ ERROR] Cannot add command "${command.name}" because this name has already been registered as a ContextMenuCommand in this manager.`);
                return command;
            }
            this._commands.push(command);
        }
        return command;
    }

    /**
     *
     * @param {string} q - command name or alias
     * @param {CommandType} t - type of command you want to get from this manager
     */
    public get(q: string, t?: undefined): BaseCommand | null;
    public get(q: string, t: "CHAT"): ChatCommand | null;
    public get(q: string, t: "NESTED"): NestedCommand | null;
    public get(q: string, t: "CONTEXT"): ContextMenuCommand | null;
    public get(q: string, t?: CommandType): BaseCommand | null {
        if (t) {
            switch (t) {
                case "CHAT":
                    return (
                        this.list(t).find((c) => {
                            if (c.name === q) {
                                return true;
                            }
                            if (c.aliases && c.aliases.length > 0 && c.aliases.find((a) => a === q)) {
                                return true;
                            } else {
                                return false;
                            }
                        }) || null
                    );
                case "NESTED":
                    return (
                        this.list(t).find((c) => {
                            if (c.name === q) {
                                return true;
                            } else {
                                return false;
                            }
                        }) || null
                    );
                case "CONTEXT":
                    return this.list(t).find((c) => c.name === q) || null;
            }
        } else {
            return this.list().find((c) => c.name === q) || null;
        }
    }

    /**
     *
     * @param {string} id - Discord command ID
     * @param {Guild | string} guild - ID of guild that this command belongs to
     * @param {boolean} noCache - whether to use cached data
     * @returns {RegisteredCommandObject} Discord command object
     */
    public async getApi(id: string, guild?: Guild | string, noCache?: boolean): Promise<RegisteredCommandObject> {
        const guildId = guild instanceof Guild ? guild.id : guild;
        if (!noCache) {
            const rqC = this.getCache(id, guildId);
            if (rqC) {
                return rqC;
            }
        }
        let rq: AxiosResponse<RegisteredCommandObject>;
        if (guildId) {
            rq = await axios.get(`${CommandManager.baseApiUrl}/applications/${this._client.applicationId}/guilds/${guildId}/commands/${id}`, {
                headers: { Authorization: `Bot ${this._client.token}` },
            });
        } else {
            rq = await axios.get(`${CommandManager.baseApiUrl}/applications/${this._client.applicationId}/commands/${id}`, {
                headers: { Authorization: `Bot ${this._client.token}` },
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
     *
     * @param {string} name - name of the command
     * @param {string} type - command type you want to get ID for
     * @param {string} guild - ID of guild that this command belongs to
     * @returns {string} Command ID from Discord API
     */
    public async getIdApi(name: string, type: CommandType, guild?: Guild | string): Promise<string | null> {
        let map: Map<string, RegisteredCommandObject> = await this.listApi(guild);
        let result: string | null = null;
        map?.forEach((c) => {
            const typeC: CommandType = c.type === 1 ? "CHAT" : "CONTEXT";
            if (c.name === name && typeC === type) {
                result = c.id;
            }
        });
        return result;
    }

    /**
     * @param {CommandType} [f] - type of commands to return
     * @returns {BaseCommand[]} An array of commands registered in this manager
     */
    public list(): readonly BaseCommand[];
    public list(f: "CHAT"): readonly ChatCommand[];
    public list(f: "CONTEXT"): readonly ContextMenuCommand[];
    public list(f: "NESTED"): readonly NestedCommand[];
    public list(f?: CommandType): readonly BaseCommand[] {
        switch (f) {
            case "CHAT":
                return Object.freeze([...this._commands.filter((c) => c.type === "CHAT")]);
            case "CONTEXT":
                return Object.freeze([...this._commands.filter((c) => c.type === "CONTEXT")]);
            default:
                return Object.freeze([...this._commands]);
        }
    }

    public async listApi(g?: Guild | string): Promise<Map<string, RegisteredCommandObject>> {
        const guildId = g instanceof Guild ? g.id : g;
        let rq: AxiosResponse<RegisteredCommandObject[]>;
        if (guildId) {
            rq = await axios.get(`${CommandManager.baseApiUrl}/applications/${this._client.applicationId}/guilds/${guildId}/commands`, {
                headers: { Authorization: `Bot ${this._client.token}` },
            });
        } else {
            rq = await axios.get(`${CommandManager.baseApiUrl}/applications/${this._client.applicationId}/commands`, {
                headers: { Authorization: `Bot ${this._client.token}` },
            });
        }
        if (rq.status === 200) {
            this.updateCache(rq.data, guildId);
            return this.arrayToMap(rq.data);
        } else {
            throw new Error(`HTTP request failed with code ${rq.status}: ${rq.statusText}`);
        }
    }

    public fetch(i: Interaction | Message): CommandInteractionData | null {
        const prefix = this.prefix.get(i.guild || undefined);
        if (i instanceof Interaction) {
            if (i.isCommand()) {
                const cmd = this.get(i.commandName, "CHAT") || this.get(i.commandName, "NESTED");
                if (cmd?.isCommandType("CHAT")) {
                    const args = cmd.processArguments(i.options.data.map((d) => d.value || null));
                    return {
                        command: cmd,
                        parameters: args,
                    };
                } else if (cmd?.isCommandType("NESTED")) {
                    const subCmd = cmd.fetchSubcommand([...i.options.data]);
                    if (subCmd) {
                        return subCmd;
                    } else {
                        throw new CommandNotFound();
                    }
                } else {
                    throw new CommandNotFound(i.commandName);
                }
            } else if (i.isContextMenu()) {
                const cmd = this.get(i.commandName, "CONTEXT");
                if (cmd) {
                    const target = new TargetID(i.targetId, i.targetType);
                    return {
                        command: cmd,
                        parameters: new Map(),
                        target: target,
                    };
                } else {
                    throw new CommandNotFound(i.commandName);
                }
            } else {
                return null;
            }
        } else if (prefix && i instanceof Message) {
            if (i.content.startsWith(prefix)) {
                const cmdName = i.content.replace(prefix, "").split(" ")[0].split(this.commandSeparator)[0];
                const cmd = this.get(cmdName, "CHAT") || this.get(cmdName, "NESTED");
                if (cmd?.isCommandType("CHAT")) {
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
                    const args = cmd.processArguments(argsRaw);
                    return {
                        command: cmd,
                        parameters: args,
                    };
                } else if (cmd?.isCommandType("NESTED")) {
                    const nesting = i.content.split(" ")[0].replace(`${prefix}${cmdName}${this.commandSeparator}`, "").split(this.commandSeparator);
                    const subCmd = cmd.getSubcommand(nesting[1] ? nesting[1] : nesting[0], nesting[1] ? nesting[0] : undefined);
                    if (subCmd) {
                        const argsRaw = i.content
                            .replace(`${prefix}${cmdName}${this.commandSeparator}${nesting.join(this.commandSeparator)}`, "")
                            .split(this.argumentSeparator)
                            .map((a) => {
                                if (a.startsWith(" ")) {
                                    return a.replace(" ", "");
                                } else {
                                    return a;
                                }
                            });
                        const args = subCmd.processArguments(argsRaw);
                        return {
                            command: subCmd,
                            parameters: args,
                        };
                    } else {
                        return {
                            command: cmd,
                            parameters: new Map(),
                        };
                    }
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

    public async register(): Promise<void> {
        const globalCommands = this._commands
            .filter((c) => {
                if (!Array.isArray(c.guilds) || c.guilds.length === 0) {
                    if (c.isCommandType("CHAT") && c.slash === false) {
                        return false;
                    } else {
                        return true;
                    }
                }
            })
            .map((c) => c.toObject());
        const guildCommands: Map<string, BaseCommandObject[]> = new Map();
        this._commands
            .filter((c) => Array.isArray(c.guilds) && c.guilds.length > 0)
            .map((c) => {
                c.guilds?.map((gId) => {
                    if (!this._client.client.guilds.cache.get(gId)) {
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

        await axios.put(`${CommandManager.baseApiUrl}/applications/${this._client.applicationId}/commands`, globalCommands, {
            headers: { Authorization: `Bot ${this._client.token}` },
        });
        await guildCommands.forEach(async (g, k) => {
            await axios.put(`${CommandManager.baseApiUrl}/applications/${this._client.applicationId}/guilds/${k}/commands`, g, {
                headers: { Authorization: `Bot ${this._client.token}` },
            });
        });
    }

    private updateCache(commands: RegisteredCommandObject[] | RegisteredCommandObject, guildId?: string): void {
        if (Array.isArray(commands)) {
            this._registerCache.set(guildId || this._globalEntryName, this.arrayToMap(commands));
            return;
        } else {
            this._registerCache.get(guildId || this._globalEntryName)?.set(commands.id, commands);
        }
    }

    private getCache(q: string, guildId?: string): RegisteredCommandObject | null {
        return this._registerCache.get(guildId || this._globalEntryName)?.get(q) || null;
    }

    private arrayToMap(a: RegisteredCommandObject[]): Map<string, RegisteredCommandObject> {
        const map: Map<string, RegisteredCommandObject> = new Map();
        a.map((rc) => {
            map.set(rc.id, rc);
        });
        return map;
    }

    public static isCommand(o: any): o is BaseCommand {
        return (
            "name" in o &&
            typeof o.name === "string" &&
            CommandRegExps.baseName.test(o.name) &&
            "type" in o &&
            (o.type === "CHAT" || o.type === "MESSAGE" || o.type === "NESTED") &&
            "dm" in o &&
            typeof o.dm === "boolean" &&
            "announceSuccess" in o &&
            typeof o.announceSuccess === "boolean" &&
            "function" in o &&
            o.function instanceof Function
        );
    }
}
