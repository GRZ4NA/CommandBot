import axios, { AxiosResponse } from "axios";
import { Guild, Interaction, Message } from "discord.js";
import { TargetID } from "./parameter.js";
import { CommandNotFound } from "../errors.js";
import { applicationState } from "../state.js";
import { ChatCommand } from "../commands/ChatCommand.js";
import { ContextMenuCommand } from "../commands/ContextMenuCommand.js";
import { Commands, CommandInit, CommandRegExps, CommandType } from "../commands/types/commands.js";
import { CommandInteractionData } from "../commands/types/commands.js";
import { APICommandObject, CommandPermission, RegisteredCommandObject, APICommandType } from "./types/api.js";
import { Bot } from "./Bot.js";
import { SubCommand } from "../commands/SubCommand.js";
import { SubCommandGroup } from "../commands/SubCommandGroup.js";
import { ChatCommandInit, ContextMenuCommandInit } from "../commands/types/InitOptions.js";
import { HelpMessageParams } from "../commands/types/HelpMessage.js";
import { HelpMessage } from "../commands/Help.js";
import { PrefixManager } from "./PrefixManager.js";
import { Command } from "../commands/base/Command.js";
import { processArguments } from "../utils/processArguments.js";

export class CommandManager {
    private readonly _commands: Command[] = [];
    private readonly _registerCache: Map<string, Map<string, RegisteredCommandObject>> = new Map();
    private readonly _globalEntryName: string = "global";
    public readonly client: Bot;
    public readonly helpCmd?: HelpMessage;

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
        this.client = client;
        this.prefix = new PrefixManager(this, prefix);
        this.argumentSeparator = argSep || ",";
        this.commandSeparator = cmdSep || "/";
        if (this.commandSeparator === this.argumentSeparator) {
            throw new Error("Command separator and argument separator have the same value");
        }
        if (helpMsg.enabled === true) {
            this.helpCmd = new HelpMessage(this, helpMsg);
            this._commands.push(this.helpCmd);
        }
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
     * @returns {Commands} A computed command object that inherits from {@link BaseCommand}
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
     *
     * @param {string} q - command name or alias
     * @param {APICommandType} t - type of command you want to get from this manager
     */
    public get<T extends CommandType>(q: string, t?: T): Commands<T> | null {
        switch (t) {
            case "CHAT":
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
                    }) as Commands<T>) || null
                );
            case "NESTED":
                return (this.list(t).find((c) => {
                    if (c.name === q) {
                        return true;
                    } else {
                        return false;
                    }
                }) || null) as Commands<T>;
            case "CONTEXT":
                return (this.list(t).find((c) => c.name === q) as Commands<T>) || null;
            default:
                return (this.list().find((c) => c.name === q) as Commands<T>) || null;
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

    public fetch(i: Interaction | Message): CommandInteractionData | null {
        const prefix = this.prefix.get(i.guild || undefined);
        if (i instanceof Interaction) {
            if (i.isCommand()) {
                const cmd = this.get(i.commandName, "CHAT");
                if (cmd) {
                    if (cmd.hasSubCommands) {
                        const subCmd = cmd.fetchSubcommand([...i.options.data]);
                        if (subCmd) return subCmd;
                    }
                    const args = processArguments(
                        cmd,
                        i.options.data.map((d) => d.value || null)
                    );
                    return {
                        command: cmd,
                        parameters: args,
                    };
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
                if (i.content === prefix) return null;
                const cmdName = i.content.replace(prefix, "").split(" ")[0].split(this.commandSeparator)[0];
                const cmd = this.get(cmdName, "CHAT");
                if (cmd) {
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
                            const subArgs = processArguments(subCmd, subArgsRaw);
                            return {
                                command: subCmd,
                                parameters: subArgs,
                            };
                        }
                    }
                    const args = processArguments(cmd, argsRaw);
                    return {
                        command: cmd,
                        parameters: args,
                    };
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

    public static isCommand(c: any): c is Command {
        return "name" in c && "type" in c && "default_permission" in c && ((c as Command).type === "CHAT" || (c as Command).type === "CONTEXT");
    }
}
