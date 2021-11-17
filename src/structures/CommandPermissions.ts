import { Interaction, Permissions, Message } from "discord.js";
import { PermissionCommand } from "../commands/base/PermissionCommand.js";
import { CommandPermissionsInit, PermissionCheckTypes, PermissionFunction } from "../commands/types/permissions.js";

/**
 * Object that stores permission resolvables and properties (bouund to a {@link PermissionCommand})
 * @class
 */
export class CommandPermissions {
    /**
     * Command bound to this object
     * @type {PermissionCommand}
     * @public
     * @readonly
     */
    public readonly command: PermissionCommand;

    /**
     * If set to "ALL", the command can only be used when all specified conditions are met. (works only for Discord.js permissions object)
     * @type {PermissionCheckTypes}
     * @public
     * @readonly
     */
    public readonly permissions: Permissions | PermissionFunction;

    /**
     * Command permissions
     * @type {Permissions | PermissionFunction}
     * @public
     * @readonly
     */
    public readonly checkType: PermissionCheckTypes;

    /**
     * @constructor
     * @param {PermissionCommand} command - command attached to this permissions object
     * @param {?CommandPermissionsInit} [o] - initialization options
     */
    constructor(command: PermissionCommand, o?: CommandPermissionsInit) {
        this.command = command;
        this.checkType = o?.checkType ?? "ANY";
        this.permissions = o?.resolvable instanceof Function ? o.resolvable : new Permissions(o?.resolvable ?? BigInt(0));
    }

    /**
     * Whether this object uses custom function to check permissions
     * @type {boolean}
     */
    get isCustom(): boolean {
        return this.permissions instanceof Function ? true : false;
    }

    /**
     * Permission bitfield
     * @type {BigInt}
     */
    get bitfield(): BigInt {
        return this.permissions instanceof Function ? BigInt(NaN) : BigInt(this.permissions.bitfield);
    }

    /**
     * Checks if the interaction sender is permitted to use the command attached to this object
     * @param {Interaction | Message} i - command interaction or Discord message
     * @returns {boolean} Whether a sender can use the command bound to this object
     * @public
     */
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
