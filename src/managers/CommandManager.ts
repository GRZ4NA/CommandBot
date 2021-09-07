import { applicationState } from "../state.js";
import { BaseCommand } from "../structures/BaseCommand.js";

export class CommandManager {
    protected readonly _list: BaseCommand[] = [];

    public get(q: string): BaseCommand | null {
        return this._list.find((c) => c.name === q) || null;
    }

    get list(): readonly BaseCommand[] {
        return Object.freeze([...this._list]);
    }

    public add(command: BaseCommand): void {
        try {
            if (applicationState.running) {
                throw new Error("Cannot add a command while the application is running");
            }
            if (BaseCommand.isCommand(command)) {
                if (this.get(command.name)) {
                    throw new Error(`A command with name "${command.name}" is already registered in this manager`);
                } else {
                    this._list.push(command);
                }
            } else {
                throw new TypeError("Incorrect argument type");
            }
        } catch (e) {
            console.error(`[❌ ERROR] ${e}`);
        }
    }
}
