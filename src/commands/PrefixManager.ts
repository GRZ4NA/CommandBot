import { Guild } from "discord.js";
import { CommandManager } from "./CommandManager.js";
import { CommandRegExps } from "./types/commands.js";
import { ScopeResolvable } from "./types/PrefixManager.js";

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

    public get(scope?: ScopeResolvable): string | null {
        if (!scope) return this.globalPrefix;
        else {
            const id = scope instanceof Guild ? scope.id : scope;
            return this._prefixes.get(id) || this.globalPrefix;
        }
    }

    public set(prefix: string, scope?: ScopeResolvable): void {
        if (!CommandRegExps.prefix.test(prefix)) throw new Error(`"${prefix}" is not a valid prefix`);
        if (!scope) {
            this._prefixes.set(this._global, prefix);
        } else {
            const id = scope instanceof Guild ? scope.id : scope;
            if (!this._manager.client.client.guilds.cache.get(id)) throw new Error(`${id} is not a valid guild ID`);
            this._prefixes.set(id, prefix);
        }
    }

    public remove(scope?: ScopeResolvable): boolean {
        if (!scope) return this._prefixes.delete(this._global);
        const id = scope instanceof Guild ? scope.id : scope;
        return this._prefixes.delete(id);
    }
}
