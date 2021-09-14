import { BitFieldResolvable, Permissions, PermissionString } from "discord.js";
import { PermissionCheckTypes } from "./types/permissions.js";

export class CheckPermissions extends Permissions {
    public readonly checkType: PermissionCheckTypes;

    constructor(o: BitFieldResolvable<PermissionString, bigint>, checkType: PermissionCheckTypes) {
        super(o);
        this.checkType = checkType;
    }
}
