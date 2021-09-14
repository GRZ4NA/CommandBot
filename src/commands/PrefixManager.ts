import { Guild } from "discord.js";
import { CommandManager } from "./CommandManager.js";
import { CommandRegExps } from "./types/commands.js";

export class PrefixManager {
    private readonly _manager: CommandManager;
    private readonly _prefixes: Map<string, string> = new Map();
    private readonly _global: string = "GLOBAL";

    constructor(manager: CommandManager, defaultPrefix?: string) {
        this._manager = manager;
        if (defaultPrefix) {
            if (!CommandRegExps.prefix.test(defaultPrefix)) {
                throw new Error(`Prefix value for ${this._global} is incorrect`);
            }
            this._prefixes.set(this._global, defaultPrefix);
        }
    }

    get manager() {
        return this._manager;
    }

    get globalPrefix() {
        return this._prefixes.get(this._global) || null;
    }

    get prefixes() {
        return Object.freeze(new Object(this._prefixes));
    }

    public get(g?: Guild | string, noGlobal?: boolean): string | null {
        const guildId = g instanceof Guild ? g.id : g;
        return this._prefixes.get(guildId ?? "") ?? noGlobal === true ? null : this.globalPrefix;
    }

    public set(prefix: string, scope: Guild | string | "global"): void {
        const guildId = scope instanceof Guild ? scope.id : scope !== "global" ? scope : null;
        if (guildId && !this._manager.client.client.guilds.cache.get(guildId)) throw new Error(`${guildId} is not a valid guild ID`);
        if (!CommandRegExps.prefix.test(prefix)) throw new Error(`Prefix value for ${guildId} is incorrect`);
        this._prefixes.set(guildId ?? this._global, prefix);
    }

    public remove(g: Guild | string | "global") {
        const guildId = g instanceof Guild ? g.id : g;
        this._prefixes.delete(guildId);
    }
}
