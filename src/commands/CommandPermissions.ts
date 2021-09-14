import { BitFieldResolvable, Permissions, PermissionString } from "discord.js";
import { PermissionCheckTypes } from "./types/CommandPermissions.js";

export class CommandPermissions extends Permissions {
    public readonly checkType: PermissionCheckTypes;

    constructor(o: BitFieldResolvable<PermissionString, bigint>, checkType: PermissionCheckTypes) {
        super(o);
        this.checkType = checkType;
    }
}
