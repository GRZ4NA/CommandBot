import { MessageEmbed, Permissions } from "discord.js";
import { ChatCommand } from "./ChatCommand.js";
import { CommandManager } from "../structures/CommandManager.js";
import { HelpMessageParams } from "./types/HelpMessage.js";

export class HelpMessage extends ChatCommand {
    constructor(cmdManager: CommandManager, params: HelpMessageParams, botName?: string) {
        super(cmdManager, {
            name: "help",
            usage: params.usage,
            permissions: undefined,
            description: params.description,
            visible: params.visible,
            parameters: [
                {
                    name: "command_name",
                    description: "Name of the command that you want to get details about",
                    optional: true,
                    type: "string",
                },
            ],
            function: (args, i) => {
                const helpMsg = new MessageEmbed();
                helpMsg.setColor(params.color);
                helpMsg.setTimestamp();
                helpMsg.setFooter(botName || "");
                if (helpMsg != null) {
                    if (args.get("command_name")) {
                        const cmd: ChatCommand | null = cmdManager.get(args.get("command_name")?.toString() || "", "CHAT");
                        if (cmd) {
                            if (Array.isArray(cmd.guilds) && cmd.guilds.length > 0 && !cmd.guilds.find((g) => i?.guild?.id === g)) {
                                throw new ReferenceError(`Command "${cmd.name}" is not available`);
                            }
                            helpMsg.setTitle(`${cmd.name} ${cmd.visible ? "" : "[HIDDEN]"}`);
                            helpMsg.setDescription(cmd.description);
                            if (cmd.usage) helpMsg.addField("Usage:", `${cmdManager.prefix.get(i.guild || undefined) || "/"}${cmd.name} ${cmd.usage}`, false);
                            if (cmd.permissions.isCustom) {
                                helpMsg.addField("Permissions:", "Custom", false);
                            } else {
                                let permList: string = "";
                                (cmd.permissions.permissions as Permissions).toArray(false).map((p) => {
                                    permList += p + "\n";
                                });
                                permList && helpMsg.addField("Permissions:", permList, false);
                            }
                            if (cmd.aliases && cmd.aliases.length > 0) {
                                let aList: string = "";
                                cmd.aliases.map((a) => {
                                    aList += a + "\n";
                                });
                                aList && helpMsg.addField("Aliases:", aList, false);
                            }
                            helpMsg.addField("Slash command:", cmd.slash ? "ENABLED" : "DISABLED", false);
                            helpMsg.addField("Command scope:", Array.isArray(cmd.guilds) && cmd.guilds.length > 0 ? "CUSTOM" : "GLOBAL", false);
                        } else {
                            throw new ReferenceError(`Command "${args.get("command_name")}" does not exist`);
                        }
                    } else {
                        helpMsg.setTitle(params.title);
                        helpMsg.setDescription(params.bottomText);

                        cmdManager.list("CHAT").map((c) => {
                            if (
                                c.visible &&
                                ((Array.isArray(c.guilds) && c.guilds.length > 0 && c.guilds.find((g) => i?.guild?.id === g)) || !Array.isArray(c.guilds) || c.guilds.length === 0)
                            ) {
                                helpMsg.addField(`${cmdManager.prefix.get(i.guild || undefined) || "/"}${c.name} ${c.usage}`, c.description, false);
                            }
                        });
                    }
                }
                return helpMsg;
            },
        });
    }
}
