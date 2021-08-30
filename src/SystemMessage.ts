import { ColorResolvable, CommandInteraction, GuildMember, Message, MessageEmbed, User } from "discord.js";
import { Command } from "./Command.js";
import { PermissionsError } from "./errors.js";

export type MessageType = "PERMISSION" | "ERROR" | "NOT_FOUND" | "SUCCESS";
export interface SystemMessageAppearance {
    enabled: boolean;
    title: string;
    bottomText?: string;
    accentColor?: ColorResolvable;
    displayDetails?: boolean;
    showTimestamp?: boolean;
    footer?: string;
    deleteTimeout?: number;
}
export interface SystemMessageData {
    command?: Command;
    phrase?: string;
    user?: GuildMember | User;
    error?: Error | PermissionsError | string;
}

export class SystemMessageManager {
    PERMISSION: SystemMessageAppearance;
    ERROR: SystemMessageAppearance;
    NOT_FOUND: SystemMessageAppearance;
    SUCCESS: SystemMessageAppearance;
    deleteTimeout: number;

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
     * @param {MessageType} type - 'ERROR' | 'PERMISSION' | 'NOT_FOUND'
     * @param {SystemMessageData} [data] - additional data to include in the message
     * @param {Message | CommandInteraction} [interaction] - if specified, the generated message will be sent in this channel
     * @returns *Promise<MessageEmbed | Message | void>*
     */
    async send(type: MessageType, data?: SystemMessageData, interaction?: Message | CommandInteraction): Promise<MessageEmbed | Message | void> {
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
                            if (data.command.permissions) {
                                let permList: string = "";
                                data.command.permissions instanceof Function
                                    ? (() => {
                                          permList = "Custom";
                                      })()
                                    : data.command.permissions.toArray(false).map((p) => {
                                          permList += p + "\n";
                                      });
                                embed.addField("Required permissions:", permList, false);
                            }
                        }
                        break;
                    case "SUCCESS":
                        break;
                }
            }
            if (interaction && !(interaction instanceof CommandInteraction)) {
                const message = await interaction.reply({ embeds: [embed] });
                if (message.deletable) {
                    if (Number.isFinite(this[type].deleteTimeout)) {
                        setTimeout(async () => {
                            await message.delete().catch();
                        }, this[type].deleteTimeout);
                    } else if (this[type].deleteTimeout === undefined && Number.isFinite(this.deleteTimeout)) {
                        setTimeout(async () => {
                            await message.delete().catch();
                        }, this.deleteTimeout);
                    }
                }
                return message;
            } else if (interaction && interaction instanceof CommandInteraction) {
                interaction.replied || interaction.deferred ? await interaction.editReply({ embeds: [embed] }) : await interaction.reply({ embeds: [embed] });
                if (Number.isFinite(this[type].deleteTimeout)) {
                    setTimeout(async () => {
                        await interaction.deleteReply().catch();
                    }, this[type].deleteTimeout);
                } else if (this[type].deleteTimeout === undefined && Number.isFinite(this.deleteTimeout)) {
                    setTimeout(async () => {
                        await interaction.deleteReply().catch();
                    }, this.deleteTimeout);
                }
            } else {
                return embed;
            }
        } else {
            console.error("[❌ ERROR] System message: Incorrect parameter");
            return;
        }
    }
}
