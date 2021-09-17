import axios, { AxiosResponse } from "axios";
import { Guild, Interaction, Message } from "discord.js";
import { TargetID } from "./parameter.js";
import { CommandNotFound } from "../errors.js";
import { applicationState } from "../state.js";
import { ChatCommand } from "../commands/ChatCommand.js";
import { ContextMenuCommand } from "../commands/ContextMenuCommand.js";
import { Command, CommandInit, CommandRegExps, CommandType } from "../commands/types/commands.js";
import { CommandInteractionData } from "../commands/types/commands.js";
import { APICommandObject, CommandPermission, RegisteredCommandObject, APICommandType } from "./types/api.js";
import { Bot } from "./Bot.js";
import { SubCommand } from "../commands/SubCommand.js";
import { SubCommandGroup } from "../commands/SubCommandGroup.js";
import { NestedCommand } from "../commands/NestedCommand.js";
import { ChatCommandInit, NestedCommandInit, ContextMenuCommandInit } from "../commands/types/InitOptions.js";
import { HelpMessageParams } from "../commands/types/HelpMessage.js";
import { HelpMessage } from "../commands/Help.js";
import { PrefixManager } from "./PrefixManager.js";
import { APICommand } from "../commands/base/APICommand.js";
import { processArguments } from "../utils/processArguments.js";

export class CommandManager {
    private readonly _client: Bot;
    private readonly _commands: APICommand[] = [];
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
    get client(): Readonly<Bot> {
        return this._client;
    }

    get cache(): Readonly<Map<string, Map<string, RegisteredCommandObject>>> {
        return this._registerCache;
    }

    get commandsCount(): Readonly<number> {
        return this._commands.length;
    }

    /**
     *
     * @param {APICommandType} type - a type of command that will be created and added to this manager
     * @param {CommandInit} options - an object containing all properties required to create this type of command
     * @returns {Command} A computed command object that inherits from {@link BaseCommand}
     */
    public add<T extends CommandType>(type: T, options: CommandInit<T>): Command<T> {
        const command: Command<T> | null =
            type === "CHAT_INPUT"
                ? (new ChatCommand(this, options as ChatCommandInit) as Command<T>)
                : type === "NESTED"
                ? (new NestedCommand(this, options as NestedCommandInit) as Command<T>)
                : type === "USER" || type === "MESSAGE"
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
        if (command.isChatCommand()) {
            if (this.list("CHAT_INPUT").find((c) => c.name === command.name)) {
                console.error(`[❌ ERROR] Cannot add command "${command.name}" because this name has already been registered as a ChatCommand in this manager.`);
                return command;
            }
            command.aliases &&
                command.aliases.length > 0 &&
                command.aliases.map((a, i, ar) => {
                    const r = this.get(a, "CHAT_INPUT");
                    if (r) {
                        console.warn(
                            `[⚠️ WARNING] Cannot register alias "${a}" because its name is already being used in other command. Command "${command.name}" will be registered without this alias.`
                        );
                        ar.splice(i, 1);
                    }
                });
            this._commands.push(command);
            return command;
        } else if (command.isContextMenuCommand()) {
            if (this.list("USER").find((c) => c.name === command.name)) {
                console.error(`[❌ ERROR] Cannot add command "${command.name}" because this name has already been registered as a ContextMenuCommand in this manager.`);
                return command;
            }
            this._commands.push(command);
            return command;
        } else if (command.isNestedCommand()) {
            if (this.list("CHAT_INPUT").find((c) => c.name === command.name)) {
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
     * @param {APICommandType} t - type of command you want to get from this manager
     */
    public get<T extends CommandType>(q: string, t?: T): Command<T> | null {
        switch (t) {
            case "CHAT_INPUT":
                return (
                    (this.list(t).find((c) => {
                        if (c.name === q) {
                            return true;
                        }
                        if (c.aliases && c.aliases.length > 0 && c.aliases.find((a) => a === q)) {
                            return true;
                        } else {
                            return false;
                        }
                    }) as Command<T>) || null
                );
            case "NESTED":
                return (this.list(t).find((c) => {
                    if (c.name === q) {
                        return true;
                    } else {
                        return false;
                    }
                }) || null) as Command<T>;
            case "USER":
            case "MESSAGE":
                return (this.list(t).find((c) => c.name === q) as Command<T>) || null;
            default:
                return (this.list().find((c) => c.name === q) as Command<T>) || null;
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
     * @param {APICommandType} [f] - type of commands to return
     * @returns {BaseCommand[]} An array of commands registered in this manager
     */
    public list(): readonly APICommand[];
    public list(f: "CHAT_INPUT"): readonly ChatCommand[];
    public list(f: "USER" | "MESSAGE"): readonly ContextMenuCommand[];
    public list(f: "NESTED"): readonly NestedCommand[];
    public list(f?: CommandType): readonly APICommand[] {
        switch (f) {
            case "CHAT_INPUT":
                return Object.freeze([...this._commands.filter((c) => c.type === "CHAT_INPUT")]);
            case "USER":
                return Object.freeze([...this._commands.filter((c) => c.type === "USER")]);
            case "MESSAGE":
                return Object.freeze([...this._commands.filter((c) => c.type === "MESSAGE")]);
            case "NESTED":
                return Object.freeze([...this._commands.filter((c) => c.type === "CHAT_INPUT" && (c as NestedCommand).isNested)]);
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
                const cmd = this.get(i.commandName, "CHAT_INPUT");
                if (cmd?.isChatCommand()) {
                    const args = processArguments(
                        cmd,
                        i.options.data.map((d) => d.value || null)
                    );
                    return {
                        command: cmd,
                        parameters: args,
                    };
                } else if (cmd?.isNestedCommand()) {
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
                const cmd = this.get(i.commandName, "USER") ?? this.get(i.commandName, "MESSAGE");
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
                const cmd = this.get(cmdName, "CHAT_INPUT");
                if (cmd?.isChatCommand()) {
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
                    const args = processArguments(cmd, argsRaw);
                    return {
                        command: cmd,
                        parameters: args,
                    };
                } else if (cmd?.isNestedCommand()) {
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
                        const args = processArguments(subCmd, argsRaw);
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
                if (c.isGuildCommand() && (!Array.isArray(c.guilds) || c.guilds.length === 0)) {
                    if (c.isChatCommand() && c.slash === false) {
                        return false;
                    } else {
                        return true;
                    }
                }
            })
            .map((c) => c.toObject());
        const guildCommands: Map<string, APICommandObject[]> = new Map();
        this._commands
            .filter((c) => c.isGuildCommand() && Array.isArray(c.guilds) && c.guilds.length > 0)
            .map((c) => {
                c.isGuildCommand() &&
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

    public async setPermissionsApi(id: string, permissions: CommandPermission[], g?: Guild | string) {
        if (typeof g === "string" && !this._client.client.guilds.cache.get(g)) throw new Error(`${g} is not a valid guild id`);
        const response = await axios.put(
            `${CommandManager.baseApiUrl}/applications/${this._client.applicationId}/${g ? (g instanceof Guild ? `guilds/${g.id}` : g) : ""}commands/${id}/permissions`,
            {
                permissions: permissions,
            },
            {
                headers: {
                    Authorization: `Bot ${this._client.token}`,
                },
            }
        );
        if (response.status !== 200) {
            throw new Error(`HTTP request failed with code ${response.status}: ${response.statusText}`);
        }
    }

    public async getPermissionsApi(id: string, g?: Guild | string) {
        if (typeof g === "string" && !this._client.client.guilds.cache.get(g)) throw new Error(`${g} is not a valid guild id`);
        const response = await axios.get(
            `${CommandManager.baseApiUrl}/applications/${this._client.applicationId}/${g ? (g instanceof Guild ? `guilds/${g.id}` : g) : ""}commands/${id}/permissions`,
            {
                headers: {
                    Authorization: `Bot ${this._client.token}`,
                },
            }
        );
        if (response.status !== 200) {
            throw new Error(`HTTP request failed with code ${response.status}: ${response.statusText}`);
        }
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

    public static isCommand(c: any): c is APICommand {
        return (
            "name" in c &&
            "type" in c &&
            "default_permission" in c &&
            ((c as APICommand).type === "CHAT_INPUT" || (c as APICommand).type === "USER" || (c as APICommand).type === "MESSAGE")
        );
    }
}
