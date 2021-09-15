import { Interaction, Permissions, Message } from "discord.js";
import { BaseCommand } from "./BaseCommand.js";
import { CommandPermissionsInit, PermissionCheckTypes, PermissionFunction } from "./types/CommandPermissions.js";

export class CommandPermissions {
    private readonly _command: BaseCommand;
    public readonly permissions: Permissions | PermissionFunction;
    public readonly checkType: PermissionCheckTypes;

    constructor(command: BaseCommand, o?: CommandPermissionsInit) {
        this._command = command;
        this.checkType = o?.checkType ?? "ANY";
        this.permissions = o?.resolvable instanceof Function ? o.resolvable : new Permissions(o?.resolvable ?? BigInt(0));
    }

    get isCustom(): boolean {
        return this.permissions instanceof Function ? true : false;
    }

    get bitfield(): BigInt {
        return this.permissions instanceof Function ? BigInt(NaN) : BigInt(this.permissions.bitfield);
    }

    get command(): Readonly<BaseCommand> {
        return this._command;
    }

    public check(i: Interaction | Message): boolean {
        if (Array.isArray(this._command.guilds) && this._command.guilds.length > 0 && !this._command.guilds.find((id) => id === i.guild?.id)) return false;
        if (this._command.dm === true && !i.guild) return false;
        if (this.permissions instanceof Function) {
            return this.permissions(i);
        } else {
            if (this.permissions.bitfield === BigInt(0)) return true;
            const memberPermissions = new Permissions(typeof i.member?.permissions === "string" ? BigInt(0) : i.member?.permissions);
            switch (this.checkType) {
                case "ALL":
                    return memberPermissions.has(this.permissions);
                case "ANY":
                    return memberPermissions.any(this.permissions);
                default:
                    return false;
            }
        }
    }
}
