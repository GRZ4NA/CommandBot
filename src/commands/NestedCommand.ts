import { Message, MessageActionRow, MessageEmbed, MessageSelectMenu } from "discord.js";
import { NestedCommandObject } from "../structures/types/api.js";
import { BaseCommand } from "./BaseCommand.js";
import { SubCommand } from "./SubCommand.js";
import { SubCommandGroup } from "./SubCommandGroup.js";
import { CommandRegExps } from "./types/commands.js";
import { NestedCommandInit } from "./types/NestedCommand.js";

export class NestedCommand extends BaseCommand {
    private readonly _children: (SubCommand | SubCommandGroup)[] = [];

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
    }

    get children() {
        return Object.freeze([...this._children]);
    }

    public append(sc: SubCommand | SubCommandGroup): SubCommand | SubCommandGroup {
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
            type: 1,
        };
    }
}
