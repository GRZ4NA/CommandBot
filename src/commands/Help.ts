import { MessageEmbed } from "discord.js";
import { ChatCommand } from "./ChatCommand.js";
import { ChatCommandManager } from "../managers/ChatCommandManager.js";
import { HelpMessageParams } from "./types/HelpMessage.js";

export class HelpMessage extends ChatCommand {
    constructor(cmdManager: ChatCommandManager, params: HelpMessageParams, botName?: string) {
        super({
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
            function: (i, p) => {
                if (!p) {
                    return;
                }
                const helpMsg = new MessageEmbed();
                helpMsg.setColor(params.color);
                helpMsg.setTimestamp();
                helpMsg.setFooter(botName || "");
                if (helpMsg != null) {
                    if (p("command_name")) {
                        const cmd: ChatCommand | null = cmdManager.get(p("command_name")?.toString() || "");
                        if (cmd) {
                            if (Array.isArray(cmd.guilds) && cmd.guilds.length > 0 && !cmd.guilds.find((g) => i?.guild?.id === g)) {
                                throw new ReferenceError(`Command "${cmd.name}" is not available`);
                            }
                            helpMsg.setTitle(`${cmd.name} ${cmd.visible ? "" : "[HIDDEN]"}`);
                            helpMsg.setDescription(cmd.description);
                            if (cmd.usage) helpMsg.addField("Usage:", `${cmdManager.prefix || "/"}${cmd.name} ${cmd.usage}`, false);
                            if (cmd.permissions) {
                                if (cmd.permissions instanceof Function) {
                                    helpMsg.addField("Permissions:", "Custom", false);
                                } else if (cmd.permissions.toArray(false).length > 0) {
                                    let permList: string = "";
                                    cmd.permissions.toArray(false).map((p) => {
                                        permList += p + "\n";
                                    });
                                    helpMsg.addField("Permissions:", permList, false);
                                }
                            }
                            if (cmd.aliases && cmd.aliases.length > 0) {
                                let aList: string = "";
                                cmd.aliases.map((a) => {
                                    aList += a + "\n";
                                });
                                helpMsg.addField("Aliases:", aList, false);
                            }
                            helpMsg.addField("Slash command:", cmd.slash ? "ENABLED" : "DISABLED", false);
                            helpMsg.addField("Command scope:", Array.isArray(cmd.guilds) && cmd.guilds.length > 0 ? "CUSTOM" : "GLOBAL", false);
                        } else {
                            throw new ReferenceError(`Command "${p("command_name")}" does not exist`);
                        }
                    } else {
                        helpMsg.setTitle(params.title);
                        helpMsg.setDescription(params.bottomText);

                        cmdManager.list.map((c) => {
                            if (
                                c instanceof ChatCommand &&
                                c.visible &&
                                ((Array.isArray(c.guilds) && c.guilds.length > 0 && c.guilds.find((g) => i?.guild?.id === g)) || !Array.isArray(c.guilds) || c.guilds.length === 0)
                            ) {
                                helpMsg.addField(`${cmdManager.prefix || "/"}${c.name} ${c.usage}`, c.description, false);
                            }
                        });
                    }
                }
                return helpMsg;
            },
        });
    }
}
