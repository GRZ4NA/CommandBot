import { FunctionCommand } from "../commands/base/FunctionCommand.js";
import { ColorResolvable, DMChannel, GuildMember, Interaction, Message, MessageEmbed, Permissions, TextChannel, User } from "discord.js";
import { PermissionsError } from "../errors.js";
import Bot from "./Bot.js";
import { BaseObject } from "./BaseObject.js";

/**
 * Types of system messages
 * @type
 */
export type MessageType = "PERMISSION" | "ERROR" | "NOT_FOUND" | "SUCCESS";

/**
 * Configuration of a system message
 * @interface
 */
export interface SystemMessageAppearance {
    /**
     * Whether this type of message is enabled
     * @type {boolean}
     */
    enabled: boolean;
    /**
     * Title field
     * @type {string}
     */
    title: string;
    /**
     * Text below the title
     * @type {?string}
     */
    description?: string;
    /**
     * Color of a message
     * @type {?ColorResolvable}
     */
    accentColor?: ColorResolvable;
    /**
     * Whether to display detailed informations in the message
     * @type {?boolean}
     */
    displayDetails?: boolean;
    /**
     * Whether to show current time and date in a footer
     * @type {?boolean}
     */
    showTimestamp?: boolean;
    /**
     * Time (in ms) after a message of this type gets deleted
     * @type {?number}
     * @remarks Set to *Infinity* to not delete the message
     */
    deleteTimeout?: number;
}

/**
 * System message data definition
 * @interface
 */
export interface SystemMessageData {
    /**
     * A {@link Command} instance
     * @type {?FunctionCommand}
     */
    command?: FunctionCommand;

    /**
     * Phrase received from a Discord channel
     * @type {?string}
     */
    phrase?: string;

    /**
     * User who used the bot
     * @type {?GuildMember | User}
     */
    user?: GuildMember | User;

    /**
     * Error object
     * @type {?Error | PermissionsError | string}
     */
    error?: Error | PermissionsError | string;
}

export interface SystemMessageConfiguration {
    ERROR: SystemMessageAppearance;
    NOT_FOUND: SystemMessageAppearance;
    PERMISSION: SystemMessageAppearance;
    SUCCESS: SystemMessageAppearance;
    deleteTimeout: number;
}

/**
 * Stores configuration and generates system messages
 *
 * System messages - predefined messages sent by the bot in special cases (for example after an error, or when a command doesn't exist)
 *
 * @remarks You can't customize messages after starting the bot. Changing these properties while the bot is running will have no effect.
 *
 * @class
 * @extends {BaseObject}
 */
export class SystemMessageManager extends BaseObject {
    /**
     * Sent whenever caller's permissions are not sufficient to run a command
     * @type {SystemMessageAppearance}
     * @public
     */
    public PERMISSION: SystemMessageAppearance;
    /**
     * Sent when an error occurs during the execution of a command
     * @type {SystemMessageAppearance}
     * @public
     */
    public ERROR: SystemMessageAppearance;
    /**
     * Sent when someone tries to run a command that does not exist (mainly by using prefix interactions)
     * @type {SystemMessageAppearance}
     * @public
     */
    public NOT_FOUND: SystemMessageAppearance;
    /**
     * Sent when a command function returns _void_ without throwing an error
     * @type {SystemMessageAppearance}
     * @public
     * @remarks An _announceSuccess_ property must be set to _true_ (default) in order to send this message
     */
    public SUCCESS: SystemMessageAppearance;
    /**
     * Global time (in ms) after a message gets deleted
     * @type {number}
     * @public
     * @remarks This time applies to all message types but it can be overwritten using local properties with the same name (for example ERROR.deleteTimeout)
     */
    public deleteTimeout: number;

    constructor(client: Bot, { ERROR, NOT_FOUND, PERMISSION, SUCCESS, deleteTimeout }: SystemMessageConfiguration) {
        super(client);
        this.ERROR = ERROR;
        this.NOT_FOUND = NOT_FOUND;
        this.PERMISSION = PERMISSION;
        this.SUCCESS = SUCCESS;
        this.deleteTimeout = deleteTimeout;
    }

    /**
     * Generates and sends a system message
     * @param {MessageType} type - "ERROR" | "PERMISSION" | "NOT_FOUND" | "SUCCESS"
     * @param {?SystemMessageData} [data] - additional data to include in the message
     * @param {?Message | Interaction | TextChannel | DMChannel} [interaction] - if specified, the generated message will be sent in this channel
     * @returns {Promise<MessageEmbed | Message | void>} A message that got sent or *void*
     * @public
     * @async
     */
    public async send(type: MessageType, data?: SystemMessageData, interaction?: Message | Interaction | TextChannel | DMChannel): Promise<MessageEmbed | Message | void> {
        if (this[type]) {
            if (this[type].enabled === false) return;
            const embed = new MessageEmbed();
            embed.setTitle(this[type].title);
            if (this[type].description) embed.setDescription(this[type].description ?? "");
            embed.setColor(this[type].accentColor || "#000000");
            if (this[type].showTimestamp) embed.setTimestamp();
            if (data) {
                switch (type) {
                    case "ERROR":
                        if (this[type].displayDetails) {
                            if (data.command) {
                                embed.addField("Command name:", data.command.name, false);
                            }
                            if (data.user) {
                                embed.addField("User:", data.user.toString(), false);
                            }
                        }
                        if (data.error) {
                            if (data.error instanceof Error) {
                                embed.setFooter(data.error.message);
                            } else if (typeof data.error == "string") {
                                embed.setFooter(data.error);
                            }
                        }
                        break;
                    case "NOT_FOUND":
                        if (data.phrase) {
                            embed.setFooter(data.phrase);
                        }
                        break;
                    case "PERMISSION":
                        if (this[type].displayDetails) {
                            if (data.user) {
                                embed.addField("User:", data.user.toString(), false);
                            }
                            if (data.command) {
                                embed.addField("Command name:", data.command.name, false);
                                if (data.command.isBaseCommandType("PERMISSION")) {
                                    if (data.command.permissions.isCustom) {
                                        embed.addField("Required permissions:", "CUSTOM", false);
                                    } else {
                                        let permList = "";
                                        (data.command.permissions.permissions as Permissions).toArray(false).map((p) => {
                                            permList += `${p}\n`;
                                        });
                                        permList && embed.addField("Required permissions:", permList, false);
                                    }
                                }
                            }
                        }
                        break;
                    case "SUCCESS":
                        break;
                }
            }
            if (interaction instanceof TextChannel || interaction instanceof DMChannel) {
                const message =
                    data?.command?.ephemeral === "FULL"
                        ? await data.user?.send({ embeds: [embed] }).catch((e) => console.error(e))
                        : await interaction.send({ embeds: [embed] }).catch((e) => console.error(e));
                if (message?.deletable) {
                    if (Number.isFinite(this[type].deleteTimeout)) {
                        setTimeout(async () => {
                            await message.delete().catch((e) => console.error(e));
                        }, this[type].deleteTimeout);
                    } else if (this[type].deleteTimeout === undefined && Number.isFinite(this.deleteTimeout)) {
                        setTimeout(async () => {
                            await message.delete().catch((e) => console.error(e));
                        }, this.deleteTimeout);
                    }
                }
                return message ?? embed;
            } else if (interaction instanceof Message) {
                const message =
                    data?.command?.ephemeral === "FULL"
                        ? await interaction.member?.send({ embeds: [embed] }).catch((e) => console.error(e))
                        : await interaction.reply({ embeds: [embed] }).catch(async () => {
                              return data?.command?.ephemeral === "FULL"
                                  ? await interaction.member?.send({ embeds: [embed] }).catch((e) => console.error(e))
                                  : await interaction.channel.send({ embeds: [embed] }).catch((e) => console.error(e));
                          });
                if (message?.deletable) {
                    if (Number.isFinite(this[type].deleteTimeout)) {
                        setTimeout(async () => {
                            await message.delete().catch((e) => console.error(e));
                        }, this[type].deleteTimeout);
                    } else if (this[type].deleteTimeout === undefined && Number.isFinite(this.deleteTimeout)) {
                        setTimeout(async () => {
                            await message.delete().catch((e) => console.error(e));
                        }, this.deleteTimeout);
                    }
                }
                return message ?? embed;
            } else if (
                interaction instanceof Interaction &&
                (interaction.isCommand() || interaction.isContextMenu() || interaction.isButton() || interaction.isSelectMenu() || interaction.isSelectMenu())
            ) {
                const message =
                    interaction.replied || interaction.deferred
                        ? await interaction.editReply({ embeds: [embed] }).catch(async () => {
                              return await interaction.channel?.send({ embeds: [embed] }).catch((e) => console.error(e));
                          })
                        : await interaction.reply({ embeds: [embed], ephemeral: data?.command?.ephemeral !== "NONE" ?? false }).catch(async () => {
                              return data?.command?.ephemeral !== "NONE"
                                  ? await interaction.user.send({ embeds: [embed] }).catch((e) => console.error(e))
                                  : await interaction.channel?.send({ embeds: [embed] }).catch((e) => console.error(e));
                          });
                if (Number.isFinite(this[type].deleteTimeout)) {
                    setTimeout(async () => {
                        await interaction.deleteReply().catch(async () => {
                            message instanceof Message && message?.deletable && (await message.delete().catch((e) => console.error(e)));
                        });
                    }, this[type].deleteTimeout);
                } else if (this[type].deleteTimeout === undefined && Number.isFinite(this.deleteTimeout)) {
                    setTimeout(async () => {
                        await interaction.deleteReply().catch(async () => {
                            message instanceof Message && message?.deletable && (await message.delete().catch((e) => console.error(e)));
                        });
                    }, this.deleteTimeout);
                }
                return message instanceof Message ? message : embed;
            } else if (interaction?.channel) {
                const message =
                    data?.command?.ephemeral === "FULL"
                        ? await interaction.user.send({ embeds: [embed] }).catch((e) => console.error(e))
                        : await interaction.channel.send({ embeds: [embed] }).catch((e) => console.error(e));
                if (message?.deletable) {
                    if (Number.isFinite(this[type].deleteTimeout)) {
                        setTimeout(async () => {
                            await message.delete().catch((e) => console.error(e));
                        }, this[type].deleteTimeout);
                    } else if (this[type].deleteTimeout === undefined && Number.isFinite(this.deleteTimeout)) {
                        setTimeout(async () => {
                            await message.delete().catch((e) => console.error(e));
                        }, this.deleteTimeout);
                    }
                }
                return message ?? embed;
            } else {
                return embed;
            }
        } else {
            console.error("[❌ ERROR] System message: Incorrect parameter");
            return;
        }
    }
}
