import { Interaction, Message, MessageEmbed, Permissions } from "discord.js";
import { ChatCommand } from "./ChatCommand.js";
import { CommandManager } from "../structures/CommandManager.js";
import { HelpMessageParams } from "./types/HelpMessage.js";
import { SubCommand } from "./SubCommand.js";
import { SubCommandGroup } from "./SubCommandGroup.js";

/**
 * @class Chat command containing a list of all command in the given manager (help message)
 */
export class HelpMessage extends ChatCommand {
    /**
     * Help message appearance options
     * @type {HelpMessageParams}
     */
    private readonly _appearance: HelpMessageParams;

    /**
     * @constructor Help message constructor
     * @param cmdManager - command manager related to this command
     * @param appearance - appearance properties
     */
    constructor(cmdManager: CommandManager, appearance: HelpMessageParams) {
        super(cmdManager, {
            name: "help",
            usage: appearance.usage,
            permissions: undefined,
            description: appearance.description,
            visible: appearance.visible,
            parameters: [
                {
                    name: "command_name",
                    description: "Name of the command that you want to get details about",
                    optional: true,
                    type: "string",
                },
            ],
            function: (input) => this.generateMessage(input.interaction, input.get("command_name", "string") ?? undefined),
        });
        this._appearance = appearance;
    }

    /**
     *
     * @param i - Discord interaction
     * @param cmdName - command name (if any)
     * @returns A computed help message in form of {@link MessageEmbed}
     */
    public generateMessage(i: Interaction | Message, cmdName?: string) {
        const helpMsg = new MessageEmbed();
        helpMsg.setColor(this._appearance.color);
        helpMsg.setTimestamp();
        helpMsg.setFooter(this.manager.client.name || "");
        if (helpMsg != null) {
            if (cmdName) {
                const cmd: ChatCommand | null = this.manager.get(cmdName?.toString() || "", "CHAT");
                if (cmd) {
                    if (Array.isArray(cmd.guilds) && cmd.guilds.length > 0 && !cmd.guilds.find((g) => i?.guild?.id === g)) {
                        throw new ReferenceError(`Command "${cmd.name}" is not available`);
                    }
                    helpMsg.setTitle(`${cmd.name} ${cmd.visible ? "" : "[HIDDEN]"}`);
                    helpMsg.setDescription(cmd.description);
                    if (cmd.usage) helpMsg.addField("Usage:", `${this.manager.prefix.get(i.guild || undefined) || "/"}${cmd.name} ${cmd.usage}`, false);
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
                    if (cmd.hasSubCommands) {
                        cmd.children.map((sc) => {
                            if (sc instanceof SubCommand) {
                                helpMsg.addField(
                                    `${this.manager.prefix.get(i.guild || undefined) ?? "/"}${cmd.name}${this.manager.commandSeparator}${
                                        sc.parent instanceof SubCommandGroup ? `${sc.parent.name}${this.manager.commandSeparator}${sc.name}` : `${sc.name}`
                                    } ${sc.usage}`,
                                    sc.description,
                                    false
                                );
                            } else {
                                sc.children.map((scgch) => {
                                    helpMsg.addField(
                                        `${this.manager.prefix.get(i.guild || undefined) ?? "/"}${cmd.name}${this.manager.commandSeparator}${sc.name}${
                                            this.manager.commandSeparator
                                        }${scgch.name} ${scgch.usage}`,
                                        scgch.description,
                                        false
                                    );
                                });
                            }
                        });
                    }
                } else {
                    throw new ReferenceError(`Command "${cmdName}" does not exist`);
                }
            } else {
                helpMsg.setTitle(this._appearance.title);
                helpMsg.setDescription(this._appearance.bottomText);

                this.manager.list("CHAT").map((c) => {
                    if (
                        c.visible &&
                        ((Array.isArray(c.guilds) && c.guilds.length > 0 && c.guilds.find((g) => i?.guild?.id === g)) || !Array.isArray(c.guilds) || c.guilds.length === 0)
                    ) {
                        if (c.hasSubCommands) {
                            c.children.map((sc) => {
                                if (sc instanceof SubCommand) {
                                    helpMsg.addField(
                                        `${this.manager.prefix.get(i.guild || undefined) ?? "/"}${c.name}${this.manager.commandSeparator}${
                                            sc.parent instanceof SubCommandGroup ? `${sc.parent.name}${this.manager.commandSeparator}${sc.name}` : `${sc.name}`
                                        } ${sc.usage}`,
                                        sc.description,
                                        false
                                    );
                                } else {
                                    sc.children.map((scgch) => {
                                        helpMsg.addField(
                                            `${this.manager.prefix.get(i.guild || undefined) ?? "/"}${c.name}${this.manager.commandSeparator}${sc.name}${
                                                this.manager.commandSeparator
                                            }${scgch.name} ${scgch.usage}`,
                                            scgch.description,
                                            false
                                        );
                                    });
                                }
                            });
                        } else {
                            helpMsg.addField(`${this.manager.prefix.get(i.guild || undefined) ?? "/"}${c.name} ${c.usage}`, c.description, false);
                        }
                    }
                });
            }
        }
        return helpMsg;
    }
}
