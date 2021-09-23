import { DMChannel, Interaction, Message, MessageEmbed, Permissions, TextChannel } from "discord.js";
import { SystemMessageAppearance, SystemMessageData, MessageType } from "./types/SystemMessage.js";

export class SystemMessageManager {
    /**
     * "Insufficient permissions" message
     * @type {SystemMessageAppearance}
     */
    public PERMISSION: SystemMessageAppearance;

    /**
     * Error message
     * @type {SystemMessageAppearance}
     */
    public ERROR: SystemMessageAppearance;

    /**
     * "Command not found" message
     * @type {SystemMessageAppearance}
     */
    public NOT_FOUND: SystemMessageAppearance;

    /**
     * "Task completed successfully" message
     * @type {SystemMessageAppearance}
     */
    public SUCCESS: SystemMessageAppearance;

    /**
     * Global time (in ms) after a message gets deleted
     * @type {number}
     */
    public deleteTimeout: number;

    constructor(botName?: string) {
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
        this.deleteTimeout = Infinity;
    }

    /**
     * Generates and sends a system message
     * @param {MessageType} type - "ERROR" | "PERMISSION" | "NOT_FOUND" | "SUCCESS"
     * @param {SystemMessageData} [data] - additional data to include in the message
     * @param {Message | CommandInteraction} [interaction] - if specified, the generated message will be sent in this channel
     * @returns {Promise<MessageEmbed | Message | void>} A message that got sent or *void*
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
            } else if (interaction instanceof Interaction && (interaction.isCommand() || interaction.isContextMenu())) {
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
