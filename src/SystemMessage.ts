import {
    ColorResolvable,
    CommandInteraction,
    DMChannel,
    GuildMember,
    Message,
    MessageEmbed,
    NewsChannel,
    TextChannel,
    User,
} from "discord.js";
import { Command } from "./Command.js";
import { PermissionsError } from "./errors.js";

export type MessageType = "PERMISSION" | "ERROR" | "NOT_FOUND";
export interface SystemMessageAppearance {
    enabled: boolean;
    title: string;
    bottomText?: string;
    accentColor?: ColorResolvable;
    showTimestamp?: boolean;
    footer?: string;
}
interface SystemMessageData {
    command?: Command;
    phrase?: string;
    user?: GuildMember | User;
    error?: Error | PermissionsError | string;
}

export class SystemMessageManager {
    PERMISSION: SystemMessageAppearance;
    ERROR: SystemMessageAppearance;
    NOT_FOUND: SystemMessageAppearance;
    deleteTimeout: number;

    constructor(botName?: string) {
        this.PERMISSION = {
            enabled: true,
            title: "👮‍♂️ Insufficient permissions",
            bottomText: "You don't have enough permissions to run this command",
            accentColor: "#1d1dc4",
            showTimestamp: true,
            footer: botName,
        };
        this.ERROR = {
            enabled: true,
            title: "❌ An error occurred",
            bottomText: "Something went wrong while processing your request.",
            accentColor: "#ff0000",
            showTimestamp: true,
            footer: botName,
        };
        this.NOT_FOUND = {
            enabled: true,
            title: "🔍 Command not found",
            accentColor: "#ff5500",
            showTimestamp: true,
            footer: botName,
        };
        this.deleteTimeout = Infinity;
    }

    /**
     * Generates and sends a system message
     * @param {MessageType} type - 'ERROR' | 'PERMISSION' | 'NOT_FOUND'
     * @param {SystemMessageData} [data] - additional data to include in the message
     * @param {TextChannel | DMChannel | NewsChannel} [interaction] - if specified, the generated message will be sent in this channel
     * @returns *Promise<MessageEmbed | Message | void>*
     */
    async send(
        type: MessageType,
        data?: SystemMessageData,
        interaction?: TextChannel | DMChannel | NewsChannel | CommandInteraction
    ): Promise<MessageEmbed | Message | void> {
        if (this[type]) {
            if (this[type].enabled === false) {
                return;
            }
            const embed = new MessageEmbed();
            embed.setTitle(this[type].title);
            if (this[type].bottomText)
                embed.setDescription(this[type].bottomText || "");
            embed.setColor(this[type].accentColor || "#000");
            if (this[type].showTimestamp) embed.setTimestamp();
            if (this[type].footer) embed.setFooter(this[type].footer || "");
            if (data) {
                switch (type) {
                    case "ERROR":
                        if (data.command) {
                            embed.addField(
                                "Command name:",
                                data.command.name,
                                false
                            );
                        }
                        if (data.error) {
                            if (data.error instanceof Error) {
                                embed.addField(
                                    "Error details:",
                                    data.error.toString(),
                                    false
                                );
                            } else if (typeof data.error == "string") {
                                embed.addField(
                                    "Error details:",
                                    data.error,
                                    false
                                );
                            }
                        }
                        if (data.user) {
                            embed.addField(
                                "User:",
                                data.user.toString(),
                                false
                            );
                        }
                        break;
                    case "NOT_FOUND":
                        if (data.phrase) {
                            embed.addField("Phrase:", data.phrase, false);
                        }
                        break;
                    case "PERMISSION":
                        if (data.user) {
                            embed.addField(
                                "User:",
                                data.user.toString(),
                                false
                            );
                        }
                        if (data.command) {
                            embed.addField(
                                "Command name:",
                                data.command.name,
                                false
                            );
                            if (data.command.permissions) {
                                let permList: string = "";
                                data.command.permissions
                                    .toArray(false)
                                    .map((p) => {
                                        permList += p + "\n";
                                    });
                                embed.addField(
                                    "Required permissions:",
                                    permList,
                                    false
                                );
                            }
                        }
                        break;
                }
            }
            if (interaction && !(interaction instanceof CommandInteraction)) {
                const message = await interaction.send({ embeds: [embed] });
                if (this.deleteTimeout != Infinity && message.deletable) {
                    setTimeout(async () => {
                        await message.delete();
                    }, this.deleteTimeout || 0);
                }
                return message;
            } else if (
                interaction &&
                interaction instanceof CommandInteraction
            ) {
                interaction.reply({ embeds: [embed] });
            } else {
                return embed;
            }
        } else {
            console.error("[❌ ERROR] System message: Incorrect parameter");
            return;
        }
    }
}
