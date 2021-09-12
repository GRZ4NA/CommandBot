import { CommandInteractionOption, Message, MessageActionRow, MessageEmbed, MessageSelectMenu } from "discord.js";
import { NestedCommandObject } from "../structures/types/api.js";
import { BaseCommand } from "./BaseCommand.js";
import { SubCommand } from "./SubCommand.js";
import { SubCommandGroup } from "./SubCommandGroup.js";
import { CommandInteractionData, CommandRegExps } from "./types/commands.js";
import { NestedCommandInit } from "./types/NestedCommand.js";

export class NestedCommand extends BaseCommand {
    private readonly _children: (SubCommand | SubCommandGroup)[] = [];
    public readonly description: string;

    constructor(o: NestedCommandInit) {
        super("CHAT", {
            name: o.name,
            guilds: o.guilds,
            announceSuccess: false,
            function: (i) => {
                if (i instanceof Message) {
                    const msg = new MessageEmbed({
                        title: `${this.name}`,
                        description: "This is a nested command. Please select one of the following subcommands",
                        timestamp: Date.now(),
                        hexColor: "#ff5500",
                    });
                    const list = new MessageSelectMenu();
                    list.setPlaceholder("Select a subcommand");
                    list.customId = `${i.author.id}/${i.channel.id}`;
                    const options = this._children
                        .map((c) => {
                            if (c instanceof SubCommand) {
                                return { label: c.name, description: c.description, value: c.name };
                            } else {
                                const nested = c.children.map((ch) => {
                                    return {
                                        label: ch.name,
                                        description: ch.description,
                                        value: c.name,
                                    };
                                });
                                return nested;
                            }
                        })
                        .flat(1);
                    list.addOptions(...options);
                    const commandBar = new MessageActionRow({ components: [list] });
                    return {
                        embeds: [msg],
                        components: [commandBar],
                    };
                } else {
                    throw new Error("Illegal command call");
                }
            },
        });
        if (!CommandRegExps.chatName.test(o.name)) {
            throw new Error(`"${o.name}" is not a valid command name (regexp: ${CommandRegExps.chatName})`);
        }
        if (o.description && !CommandRegExps.chatDescription.test(o.description)) {
            throw new Error(`The description of "${o.name}" doesn't match a regular expression ${CommandRegExps.chatDescription}`);
        }
        this.description = o.description || "No description";
    }

    get children() {
        return Object.freeze([...this._children]);
    }

    public append<T extends SubCommand | SubCommandGroup>(sc: T): T {
        if (this._children.find((c) => c.name === sc.name)) {
            throw new Error(`The name "${sc.name}" is already registered in "${this.name}"`);
        } else {
            sc.parent = this;
            this._children.push(sc);
            return sc;
        }
    }

    public toObject(): NestedCommandObject {
        return {
            ...super.toObject(),
            options: this._children.map((c) => c.toObject()),
            description: this.description,
            type: 1,
        };
    }

    public fetchSubcommand(options: CommandInteractionOption[]): CommandInteractionData | null {
        if (options[0]) {
            if (options[0].type === "SUB_COMMAND_GROUP") {
                const grName = options[0].name;
                const group = this._children.filter((c) => c instanceof SubCommandGroup).find((c) => c.name === grName) as SubCommandGroup;
                const scOpt = options[0].options;
                if (group && scOpt) {
                    const scName = scOpt[0].name;
                    const cmd = group.children.filter((c) => c instanceof SubCommand).find((c) => c.name === scName) as SubCommand;
                    if (cmd && scOpt[0].options) {
                        return {
                            command: cmd,
                            parameters: cmd.processArguments(scOpt[0].options.map((o) => o.value || null)) || new Map(),
                        };
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            } else if (options[0].type === "SUB_COMMAND") {
                const cmd = this._children.filter((c) => c instanceof SubCommand).find((c) => c.name === options[0].name) as SubCommand;
                if (cmd) {
                    return {
                        command: cmd,
                        parameters: options[0].options ? cmd.processArguments(options[0].options.map((o) => o.value || null)) : new Map(),
                    };
                } else {
                    return null;
                }
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    public getSubcommand(name: string, group?: string): SubCommand | null {
        if (group) {
            const gr = this._children.filter((c) => c instanceof SubCommandGroup).find((g) => g.name === group) as SubCommandGroup;
            if (gr) {
                return gr.children.find((c) => c.name === name) || null;
            } else {
                return null;
            }
        } else {
            return (this._children.filter((c) => c instanceof SubCommand).find((c) => c.name === name) as SubCommand) || null;
        }
    }
}