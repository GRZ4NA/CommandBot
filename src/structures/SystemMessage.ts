import { DMChannel, Interaction, Message, MessageEmbed, Permissions, TextChannel } from "discord.js";
import Bot from "./Bot.js";
import { SystemMessageAppearance, SystemMessageData, MessageType } from "./types/SystemMessage.js";

/**
 * Stores configuration and generates system messages
 *
 * System messages - predefined messages sent by the bot in special cases (for example after an error, or when a command doesn't exist)
 *
 * @remarks You can't customize messages after starting the bot. Changing these properties while the bot is running will have no effect.
 *
 * @class
 */
export class SystemMessageManager {
    /**
     * Client parent attached to this manager
     * @type {Bot}
     * @public
     * @readonly
     */
    public readonly client: Bot;
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

    constructor(client: Bot, botName?: string) {
        this.PERMISSION = {
            enabled: true,
            title: "👮‍♂️ Insufficient permissions",
            bottomText: "You don't have enough permissions to run this command",
            accentColor: "#1d1dc4",
            displayDetails: true,
            showTimestamp: true,
            footer: botName,
        };
        this.ERROR = {
            enabled: true,
            title: "❌ An error occurred",
            bottomText: "Something went wrong while processing your request.",
            accentColor: "#ff0000",
            displayDetails: true,
            showTimestamp: true,
            footer: botName,
        };
        this.NOT_FOUND = {
            enabled: true,
            title: "🔍 Command not found",
            accentColor: "#ff5500",
            displayDetails: true,
            showTimestamp: true,
            footer: botName,
        };
        this.SUCCESS = {
            enabled: true,
            title: "✅ Task completed successfully",
            accentColor: "#00ff00",
            displayDetails: true,
            showTimestamp: true,
            footer: botName,
            deleteTimeout: Infinity,
        };
        this.client = client;
        this.deleteTimeout = Infinity;
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
            if (this[type].enabled === false) {
                return;
            }
            const embed = new MessageEmbed();
            embed.setTitle(this[type].title);
            if (this[type].bottomText) embed.setDescription(this[type].bottomText || "");
            embed.setColor(this[type].accentColor || "#000");
            if (this[type].showTimestamp) embed.setTimestamp();
            if (this[type].footer) embed.setFooter(this[type].footer || "");
            if (data && this[type].displayDetails) {
                switch (type) {
                    case "ERROR":
                        if (data.command) {
                            embed.addField("Command name:", data.command.name, false);
                        }
                        if (data.error) {
                            if (data.error instanceof Error) {
                                embed.addField("Error details:", data.error.toString(), false);
                            } else if (typeof data.error == "string") {
                                embed.addField("Error details:", data.error, false);
                            }
                        }
                        if (data.user) {
                            embed.addField("User:", data.user.toString(), false);
                        }
                        break;
                    case "NOT_FOUND":
                        if (data.phrase) {
                            embed.addField("Phrase:", data.phrase, false);
                        }
                        break;
                    case "PERMISSION":
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
                        break;
                    case "SUCCESS":
                        break;
                }
            }
            if (interaction instanceof TextChannel || interaction instanceof DMChannel) {
                const message = await interaction.send({ embeds: [embed] }).catch((e) => console.error(e));
                if (message && message.deletable) {
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
                const message = await interaction.reply({ embeds: [embed] }).catch(async () => {
                    return await interaction.channel.send({ embeds: [embed] }).catch((e) => console.error(e));
                });
                if (message && message.deletable) {
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
                        : await interaction.reply({ embeds: [embed] }).catch(async () => {
                              return await interaction.channel?.send({ embeds: [embed] }).catch((e) => console.error(e));
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
                const message = await interaction.channel.send({ embeds: [embed] }).catch((e) => console.error(e));
                if (message && message.deletable) {
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
