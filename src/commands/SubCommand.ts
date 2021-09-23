import { generateUsageFromArguments } from "../utils/generateUsageFromArguments.js";
import { DefaultParameter, Parameter, TargetID } from "../structures/parameter.js";
import { PermissionCommand } from "./base/PermissionCommand.js";
import { SubCommandGroup } from "./SubCommandGroup.js";
import { CommandRegExps } from "./types/commands.js";
import { SubCommandInit } from "./types/InitOptions.js";
import { ChatCommandObject, ChatCommandOptionObject, ChatCommandOptionType, TextCommandOptionChoiceObject } from "../structures/types/api.js";
import { ParameterResolvable } from "../structures/types/Parameter.js";
import { Interaction, Message } from "discord.js";
import { ChatCommand } from "./ChatCommand.js";

export class SubCommand extends PermissionCommand {
    private readonly _parent: SubCommandGroup | ChatCommand;
    /**
     * Command description displayed in the help message or in slash commands menu (Default description: "No description")
     * @type {string}
     */
    public readonly description: string;
    /**
     * List of parameters that can passed to this command
     * @type {Array} {@link Parameter}
     */
    public readonly parameters: Parameter[];
    /**
     * Command usage displayed in the help message
     * @type {string}
     */
    public readonly usage?: string;

    constructor(parent: SubCommandGroup | ChatCommand, options: SubCommandInit) {
        super(parent instanceof SubCommandGroup ? parent.parent.manager : parent.manager, "CHAT", {
            name: options.name,
            announceSuccess: options.announceSuccess,
            permissions: options.permissions,
            function: options.function,
        });

        this._parent = parent;
        this.description = options.description || "No description";
        if (options.parameters == "no_input" || !options.parameters) {
            this.parameters = [];
        } else if (options.parameters == "simple") {
            this.parameters = [new DefaultParameter()];
        } else {
            this.parameters = options.parameters.map((ps) => new Parameter(ps));
        }
        this.usage = options.usage || generateUsageFromArguments(this);

        if (!CommandRegExps.chatName.test(this.name)) {
            throw new Error(`"${this.name}" is not a valid command name (regexp: ${CommandRegExps.chatName})`);
        }
        if (this.description && !CommandRegExps.chatDescription.test(this.description)) {
            throw new Error(`The description of "${this.name}" doesn't match a regular expression ${CommandRegExps.chatDescription}`);
        }
    }

    public async start(args: ReadonlyMap<string, ParameterResolvable>, interaction: Message | Interaction, target?: TargetID): Promise<void> {
        if (this._parent instanceof SubCommandGroup ? !this._parent.parent.dm && !interaction.guild : !this._parent.dm && !interaction.guild)
            throw new Error(`Command "${this.name}" is only available inside a guild.`);
        if (
            this._parent instanceof SubCommandGroup
                ? this._parent.parent.guilds && this._parent.parent.guilds.length > 0 && !this._parent.parent.guilds.find((id) => id === interaction.guild?.id)
                : this._parent.guilds && this._parent.guilds.length > 0 && !this._parent.guilds.find((id) => id === interaction.guild?.id)
        )
            throw new Error(`Command "${this.name}" is not available.`);
        await super.start(args, interaction, target);
    }

    public toObject(): ChatCommandObject {
        const obj: ChatCommandObject = {
            ...super.toObject(),
            type: 1 as 1,
            description: this.description,
        };
        let options: ChatCommandOptionObject[] = [];
        if (this.parameters) {
            options = this.parameters
                .map((p) => {
                    let type = 3;
                    switch (p.type) {
                        case "boolean":
                            type = 5;
                            break;
                        case "user":
                            type = 6;
                            break;
                        case "channel":
                            type = 7;
                            break;
                        case "role":
                            type = 8;
                            break;
                        case "mentionable":
                            type = 9;
                            break;
                        case "number":
                            type = 10;
                            break;
                        case "target":
                            throw new Error(`"target" parameter cannot be used in chat commands`);
                        default:
                            type = 3;
                            break;
                    }
                    const choices: TextCommandOptionChoiceObject[] = [];
                    if (p.choices) {
                        p.choices.map((c) => {
                            choices.push({ name: c, value: c });
                        });
                    }
                    const optionObj: ChatCommandOptionObject = {
                        name: p.name,
                        description: p.description,
                        required: !p.optional,
                        type: p.choices ? 3 : (type as ChatCommandOptionType),
                        choices: choices.length > 0 ? choices : undefined,
                    };
                    return optionObj;
                })
                .sort((a, b) => {
                    if (a.required && !b.required) {
                        return -1;
                    } else if (a.required && b.required) {
                        return 0;
                    } else if (!a.required && b.required) {
                        return 1;
                    }
                    return 0;
                });
            obj.options = options;
        }
        return obj;
    }
}
