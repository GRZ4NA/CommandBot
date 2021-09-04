export class StateManager {
    private _isRunning: boolean = false;

    get running() {
        return this._isRunning;
    }

    set running(bool) {
        if (!this._isRunning) {
            this._isRunning = bool;
        }
    }
}
