import { MessageEmbed } from "discord.js";
import { Command } from "./Command.js";
import { CommandManager } from "./CommandManager.js";
import { HelpMessageParams } from "./types.js";

export class HelpMessage extends Command {
    constructor(
        cmdManager: CommandManager,
        params: HelpMessageParams,
        botName?: string
    ) {
        super({
            name: "help",
            usage: params.usage,
            permissions: undefined,
            description: params.description,
            parameters: [
                {
                    name: "command_name",
                    description:
                        "Name of the command that you want to get details about",
                    optional: true,
                    type: "string",
                },
            ],
            function: (param, _) => {
                const helpMsg = new MessageEmbed();
                helpMsg.setColor(params.color);
                helpMsg.setTimestamp();
                helpMsg.setFooter(botName || "");
                if (helpMsg != null) {
                    if (param("command_name")) {
                        const cmd: Command | null = cmdManager.get(
                            param("command_name")?.toString() || "",
                            "ALL"
                        );
                        if (cmd) {
                            helpMsg.setTitle(
                                `${cmd.name} ${cmd.visible ? "" : "[HIDDEN]"}`
                            );
                            helpMsg.setDescription(cmd.description);
                            if (cmd.usage)
                                helpMsg.addField(
                                    "Usage:",
                                    `${cmdManager.prefix}${cmd.name} ${cmd.usage}`,
                                    false
                                );
                            if (
                                cmd.permissions &&
                                cmd.permissions.toArray(false).length > 0
                            ) {
                                let permList: string = "";
                                cmd.permissions.toArray(false).map((p) => {
                                    permList += p + "\n";
                                });
                                helpMsg.addField(
                                    "Permissions:",
                                    permList,
                                    false
                                );
                            }
                            if (cmd.aliases && cmd.aliases.length > 0) {
                                let aList: string = "";
                                cmd.aliases.map((a) => {
                                    aList += a + "\n";
                                });
                                helpMsg.addField("Aliases:", aList, false);
                            }
                            if (cmd.keywords && cmd.keywords.length > 0) {
                                let kwrdList: string = "";
                                cmd.keywords.map((k) => {
                                    kwrdList += k + "\n";
                                });
                                helpMsg.addField("Keywords:", kwrdList, false);
                            }
                        } else {
                            throw new ReferenceError(
                                `Command "${param(
                                    "command_name"
                                )}" does not exist`
                            );
                        }
                    } else {
                        helpMsg.setTitle(params.title);
                        helpMsg.setDescription(params.bottomText);

                        cmdManager.list.map((c) => {
                            if (c.visible) {
                                helpMsg.addField(
                                    `${cmdManager.prefix}${c.name} ${c.usage}`,
                                    c.description,
                                    false
                                );
                            }
                        });
                    }
                }
                return helpMsg;
            },
        });
    }
}
