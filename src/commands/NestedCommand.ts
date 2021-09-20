import { CommandInteractionOption, Message, MessageEmbed } from "discord.js";
import { processArguments } from "../utils/processArguments.js";
import { CommandManager } from "../structures/CommandManager.js";
import { GuildCommand } from "./base/GuildCommand.js";
import { SubCommand } from "./SubCommand.js";
import { SubCommandGroup } from "./SubCommandGroup.js";
import { ChildCommand, ChildCommandInit, ChildCommandType, CommandInteractionData, CommandRegExps } from "./types/commands.js";
import { NestedCommandInit, SubCommandGroupInit, SubCommandInit } from "./types/InitOptions.js";

export class NestedCommand extends GuildCommand {
    private readonly _children: (SubCommand | SubCommandGroup)[] = [];
    public readonly description: string;
    public readonly isNested: boolean = true;

    constructor(manager: CommandManager, options: NestedCommandInit) {
        super(manager, "CHAT_INPUT", {
            name: options.name,
            guilds: options.guilds,
            announceSuccess: false,
            dm: options.dm,
            function: (_, i) => {
                if (i instanceof Message) {
                    const msg = new MessageEmbed().setColor("#ff5500").setTitle("Subcommand").setDescription("This is a subcommand. Please enter one of the following options.");
                    this._children.map((c) => {
                        if (c instanceof SubCommandGroup) {
                            c.children.map((ch) => {
                                msg.addField(
                                    `${this.manager.prefix.get(i.guild || undefined) || "/"}${this.name}${this.manager.commandSeparator}${c.name}${this.manager.commandSeparator}${
                                        ch.name
                                    }`,
                                    ch.description,
                                    false
                                );
                            });
                        } else {
                            msg.addField(`${this.manager.prefix.get(i.guild || undefined) || "/"}${this.name}${this.manager.commandSeparator}${c.name}`, c.description, false);
                        }
                    });
                    return msg;
                } else {
                    throw new Error("Illegal command call");
                }
            },
        });

        this.description = options.description || "No description";

        if (!CommandRegExps.chatName.test(this.name)) {
            throw new Error(`"${this.name}" is not a valid command name (regexp: ${CommandRegExps.chatName})`);
        }
        if (this.description && !CommandRegExps.chatDescription.test(this.description)) {
            throw new Error(`The description of "${this.name}" doesn't match a regular expression ${CommandRegExps.chatDescription}`);
        }
    }

    get children() {
        return Object.freeze([...this._children]);
    }

    public append<T extends ChildCommandType>(type: T, options: ChildCommandInit<T>): ChildCommand<T> {
        const sc: ChildCommand<T> | null =
            type === "COMMAND"
                ? (new SubCommand(this, options as SubCommandInit) as ChildCommand<T>)
                : type === "GROUP"
                ? (new SubCommandGroup(this, options as SubCommandGroupInit) as ChildCommand<T>)
                : null;
        if (!sc) {
            throw new TypeError("Incorrect command type");
        }
        if (this._children.find((c) => c.name === sc.name)) {
            throw new Error(`The name "${sc.name}" is already registered in "${this.name}"`);
        } else {
            this._children.push(sc);
            return sc;
        }
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
                            parameters:
                                processArguments(
                                    cmd,
                                    scOpt[0].options.map((o) => o.value || null)
                                ) || new Map(),
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
                        parameters: options[0].options
                            ? processArguments(
                                  cmd,
                                  options[0].options.map((o) => o.value || null)
                              )
                            : new Map(),
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
