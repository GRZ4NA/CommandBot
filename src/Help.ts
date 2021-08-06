import { ColorResolvable, MessageEmbed } from "discord.js";
import { Command, CommandManager } from "./Command.js";

export interface HelpMessageParams {
    enabled: boolean;
    title: string;
    bottomText: string;
    color: ColorResolvable;
    description: string;
    usage: string;
}

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
                    name: "Command name",
                    optional: true,
                    type: "TEXT",
                },
            ],
            function: (_, a) => {
                const helpMsg = new MessageEmbed();
                helpMsg.setColor(params.color);
                helpMsg.setTimestamp();
                helpMsg.setFooter(botName || "");
                if (helpMsg != null) {
                    if (a && a[0]) {
                        const cmd: Command | null = cmdManager.get(
                            a[0].toString(),
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
                            if (cmd.permissions.toArray(false).length > 0) {
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
                            if (cmd.aliases.length > 0) {
                                let aList: string = "";
                                cmd.aliases.map((a) => {
                                    aList += a + "\n";
                                });
                                helpMsg.addField("Aliases:", aList, false);
                            }
                            if (cmd.keywords.length > 0) {
                                let kwrdList: string = "";
                                cmd.keywords.map((k) => {
                                    kwrdList += k + "\n";
                                });
                                helpMsg.addField("Keywords:", kwrdList, false);
                            }
                        } else {
                            throw new ReferenceError(
                                `Command "${a[0]}" does not exist`
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
