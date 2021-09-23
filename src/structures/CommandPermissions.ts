import { Interaction, Permissions, Message } from "discord.js";
import { PermissionCommand } from "../commands/base/PermissionCommand.js";
import { CommandPermissionsInit, PermissionCheckTypes, PermissionFunction } from "../commands/types/permissions.js";

export class CommandPermissions {
    public readonly command: PermissionCommand;
    public readonly permissions: Permissions | PermissionFunction;
    public readonly checkType: PermissionCheckTypes;

    constructor(command: PermissionCommand, o?: CommandPermissionsInit) {
        this.command = command;
        this.checkType = o?.checkType ?? "ANY";
        this.permissions = o?.resolvable instanceof Function ? o.resolvable : new Permissions(o?.resolvable ?? BigInt(0));
    }

    get isCustom(): boolean {
        return this.permissions instanceof Function ? true : false;
    }

    get bitfield(): BigInt {
        return this.permissions instanceof Function ? BigInt(NaN) : BigInt(this.permissions.bitfield);
    }

    public check(i: Interaction | Message): boolean {
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
