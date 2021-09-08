export class StateManager {
    private _isRunning: boolean = false;
    private readonly _unstable: boolean = true;

    get running() {
        return this._isRunning;
    }

    set running(bool) {
        if (!this._isRunning) {
            this._isRunning = bool;
        }
    }

    get dev() {
        return this._unstable;
    }
}
