import { Guild } from "discord.js";
import { CommandManager } from "./CommandManager.js";
import { CommandRegExps } from "./types/commands";

export class PrefixManager {
    private readonly _manager: CommandManager;
    private readonly _prefixes: Map<string, string> = new Map();
    private readonly global: string = "GLOBAL";

    constructor(manager: CommandManager, defaultPrefix?: string) {
        this._manager = manager;
        if (defaultPrefix) {
            if (!CommandRegExps.prefix.test(defaultPrefix)) {
                throw new Error(`Prefix value for ${this.global} is incorrect`);
            }
            this._prefixes.set(this.global, defaultPrefix);
        }
    }

    get manager() {
        return this._manager;
    }

    get globalPrefix() {
        return this._prefixes.get(this.global) || null;
    }

    public get(g?: Guild | string, noDefault?: boolean): string | null {
        const guildId = g instanceof Guild ? g.id : g;
        return this._prefixes.get(noDefault ? guildId ?? "" : guildId ?? this.global) || null;
    }

    public set(prefix: string, g?: Guild | string): void {
        if (typeof g === "string" && !this._manager.client.client.guilds.cache.get(g)) throw new Error(`${g} is not a valid guild ID`);
        const guildId = g instanceof Guild ? g.id : g;
        if (!CommandRegExps.prefix.test(prefix)) throw new Error(`Prefix value for ${guildId} is incorrect`);
        this._prefixes.set(guildId ?? this.global, prefix);
    }

    public remove(g: Guild | string | "global") {
        const guildId = g instanceof Guild ? g.id : g;
        this._prefixes.delete(guildId);
    }
}
