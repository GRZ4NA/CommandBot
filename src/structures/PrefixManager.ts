import { Guild } from "discord.js";
import { CommandManager } from "./CommandManager";
import { CommandRegExps } from "../commands/types/commands";

/**
 * Prefix scope types
 * @type
 */
export type ScopeResolvable = string | Guild;

/**
 * Maps server IDs with command prefixes and allows to manage them
 * @class
 * @experimental This feature should be fully functional but it doesn't store its data in any kind of local storage or cache. All informations get lost after restarting the application. It is possible to create a store for that data (exporting to a file or in some kind of database) and then load it every time the application starts.
 */
export class PrefixManager {
    /**
     * Prefixes data
     * @type {Map<string, string>}
     * @private
     * @readonly
     */
    private readonly _prefixes: Map<string, string> = new Map();
    /**
     * Global scope identifier
     * @type {string}
     * @private
     * @readonly
     */
    private readonly _global: string = "GLOBAL";
    /**
     * Command manager associated with the object
     * @type {CommandManager}
     * @public
     * @readonly
     */
    public readonly manager: CommandManager;

    /**
     * @constructor
     * @param manager - manager attached to this object
     * @param {?string} [defaultPrefix] - default global prefix
     */
    constructor(manager: CommandManager, defaultPrefix?: string) {
        this.manager = manager;
        if (defaultPrefix) {
            if (!CommandRegExps.prefix.test(defaultPrefix)) {
                throw new Error(`Prefix value for ${this._global} is incorrect`);
            }
            this._prefixes.set(this._global, defaultPrefix);
        }
    }

    /**
     * Manager global prefix
     * @type {?string}
     */
    get globalPrefix() {
        return this._prefixes.get(this._global) || null;
    }
    /**
     * Manager data
     * @type {Readonly<Map<string, string>>}
     */
    get prefixes() {
        return Object.freeze(Object.create(this._prefixes));
    }

    /**
     * Get prefix for a specified scope
     * @param {ScopeResolvable} scope - guild object or ID
     * @returns {?string} a prefix used in given scope
     * @public
     */
    public get(scope?: ScopeResolvable): string | null {
        if (!scope) return this.globalPrefix;
        else {
            const id = scope instanceof Guild ? scope.id : scope;
            return this._prefixes.get(id) || this.globalPrefix;
        }
    }
    /**
     * Set prefix for a specific scope
     * @param {string} prefix - new prefix
     * @param {?ScopeResolvable} [scope]  - guild string or ID
     * @return {void}
     * @public
     */
    public set(prefix: string, scope?: ScopeResolvable): void {
        if (!CommandRegExps.prefix.test(prefix)) throw new Error(`"${prefix}" is not a valid prefix`);
        if (!scope) {
            this._prefixes.set(this._global, prefix);
        } else {
            const id = scope instanceof Guild ? scope.id : scope;
            if (!this.manager.client.client.guilds.cache.get(id)) throw new Error(`${id} is not a valid guild ID`);
            this._prefixes.set(id, prefix);
        }
    }
    /**
     * Remove prefix for the specified scope
     * @param {?ScopeResolvable} [scope] - guild string or ID
     * @return {boolean}
     * @public
     */
    public remove(scope?: ScopeResolvable): boolean {
        if (!scope) return this._prefixes.delete(this._global);
        const id = scope instanceof Guild ? scope.id : scope;
        return this._prefixes.delete(id);
    }
}
