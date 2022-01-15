/**
 * Holds global state variables responsible for application life cycle
 * @class
 */
export class StateManager {
    /**
     * Whether the bot is up and running
     * @type {boolean}
     * @private
     */
    private _isRunning: boolean = false;
    /**
     * Whether this version of CommandBot is an unstable release
     * @type {boolean}
     * @private
     * @readonly
     */
    private readonly _unstable: boolean = false;

    /**
     * Whether the bot is running
     * @type {boolean}
     */
    get running() {
        return this._isRunning;
    }
    /**
     * _unstable property getter
     * @type {boolean}
     */
    get dev() {
        return this._unstable;
    }

    /**
     * Setter for running state
     * @remarks
     * Once set to true, it cannnot be switched back to *false* until the application restart or crash
     */
    set running(bool) {
        if (!this._isRunning) {
            this._isRunning = bool;
        }
    }
}
