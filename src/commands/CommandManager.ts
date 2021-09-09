import axios from "axios";
import { Guild, Interaction, Message } from "discord.js";
import { TargetID } from "../structures/parameter.js";
import { CommandNotFound } from "../errors.js";
import { applicationState } from "../state.js";
import { BaseCommand } from "./BaseCommand.js";
import { ChatCommand } from "./ChatCommand.js";
import { ContextMenuCommand } from "./ContextMenuCommand.js";
import { CommandType } from "./types/commands.js";
import { CommandInteractionData } from "./types/commands.js";
import { BaseCommandObject, RegisteredCommandObject } from "../structures/types/api.js";
import { Bot } from "../structures/Bot.js";

export class CommandManager {
    private readonly _client: Bot;
    private readonly _commands: BaseCommand[] = [];
    private readonly _registerCache: Map<string, Map<string, RegisteredCommandObject>> = new Map();
    private readonly _globalEntryName: string = "global";
    public readonly prefix?: string;
    public readonly argumentSeparator: string;
    public static readonly baseApiUrl: string = "https://discord.com/api/v8";

    constructor(client: Bot, prefix?: string, argSep?: string) {
        this._client = client;
        this.prefix = prefix;
        this.argumentSeparator = argSep || ",";
    }

    public add(command: BaseCommand): void {
        if (applicationState.running) {
            console.warn(`[❌ ERROR] Cannot add command "${command.name}" while the application is running.`);
            return;
        }
        if (command.isChatCommand()) {
            if (this.list("CHAT").find((c) => c.name === command.name)) {
                console.error(`[❌ ERROR] Cannot add command "${command.name}" because this name has already been registered as a ChatCommand in this manager.`);
                return;
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
            return;
        } else if (command.isContextMenuCommand()) {
            if (this.list("CONTEXT").find((c) => c.name === command.name)) {
                console.error(`[❌ ERROR] Cannot add command "${command.name}" because this name has already been registered as a ContextMenuCommand in this manager.`);
                return;
            }
            this._commands.push(command);
            return;
        }
    }

    public get(q: string, t?: undefined): BaseCommand | null;
    public get(q: string, t: "CHAT"): ChatCommand | null;
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
                case "CONTEXT":
                    return this.list(t).find((c) => c.name === q) || null;
            }
        } else {
            return this.list().find((c) => c.name === q) || null;
        }
    }

    public async getApi(id: string, guild?: Guild | string, noCache?: boolean): Promise<RegisteredCommandObject> {
        const guildId = guild instanceof Guild ? guild.id : guild;
        if (guildId) {
            if (!noCache) {
                const rqC = this.getCache(id, guildId);
                if (rqC) {
                    return rqC;
                }
            }
            const rq = await axios.get(`${CommandManager.baseApiUrl}/applications/${this._client.applicationId}/guilds/${guildId}/commands/${id}`);
            if (rq.status === 200) {
                this.updateCache(rq.data, guildId);
                return rq.data as RegisteredCommandObject;
            } else {
                throw new Error(`HTTP request failed with code ${rq.status}: ${rq.statusText}`);
            }
        } else {
            if (!noCache) {
                const rqC = this.getCache(id, guildId);
                if (rqC) {
                    return rqC;
                }
            }
            const rq = await axios.get(`${CommandManager.baseApiUrl}/applications/${this._client.applicationId}/commands/${id}`, { headers: `Bot ${this._client.token}` });
            if (rq.status === 200) {
                this.updateCache(rq.data);
                return rq.data as RegisteredCommandObject;
            } else {
                throw new Error(`HTTP request failed with code ${rq.status}: ${rq.statusText}`);
            }
        }
    }

    public list(): readonly BaseCommand[];
    public list(f: "CHAT"): readonly ChatCommand[];
    public list(f: "CONTEXT"): readonly ContextMenuCommand[];
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

    public async listApi(g?: Guild | string): Promise<RegisteredCommandObject[]> {
        const guildId = g instanceof Guild ? g.id : g;
        if (guildId) {
            const rq = await axios.get(`${CommandManager.baseApiUrl}/applications/${this._client.applicationId}/guilds/{guild.id}/commands`, {
                headers: { Authorization: `Bot ${this._client.token}` },
            });
            if (rq.status === 200) {
                this.updateCache(rq.data, guildId);
                return rq.data as RegisteredCommandObject[];
            } else {
                throw new Error(`HTTP request failed with code ${rq.status}: ${rq.statusText}`);
            }
        } else {
            const rq = await axios.get(`${CommandManager.baseApiUrl}/applications/${this._client.applicationId}/commands`, { headers: `Bot ${this._client.token}` });
            if (rq.status === 200) {
                this.updateCache(rq.data);
                return rq.data as RegisteredCommandObject[];
            } else {
                throw new Error(`HTTP request failed with code ${rq.status}: ${rq.statusText}`);
            }
        }
    }

    public fetch(i: Interaction | Message): CommandInteractionData | null {
        if (i instanceof Interaction) {
            if (i.isCommand()) {
                const cmd = this.get(i.commandName, "CHAT");
                if (cmd) {
                    const args = cmd.processArguments(i.options.data.map((d) => d.value || null));
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
        } else if (this.prefix && i instanceof Message) {
            if (i.content.startsWith(this.prefix)) {
                const cmdName = i.content.replace(this.prefix, "").split(" ")[0];
                const cmd = this.get(cmdName, "CHAT");
                if (cmd) {
                    const argsRaw = i.content
                        .replace(`${this.prefix}${cmdName}`, "")
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

    public async register() {
        const globalCommands = this._commands
            .filter((c) => {
                if (!Array.isArray(c.guilds) || c.guilds.length === 0) {
                    if (c.isChatCommand() && !c.slash) {
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
            const commandMap: Map<string, RegisteredCommandObject> = new Map();
            commands.map((rc) => {
                commandMap.set(rc.id, rc);
            });
            this._registerCache.set(guildId || this._globalEntryName, commandMap);
            return;
        } else {
            this._registerCache.get(guildId || this._globalEntryName)?.set(commands.id, commands);
        }
    }

    private getCache(q: string, guildId?: string): RegisteredCommandObject | null {
        return this._registerCache.get(guildId || this._globalEntryName)?.get(q) || null;
    }
}
