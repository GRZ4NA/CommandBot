//IMPORTS
import {
    Permissions,
    Message,
    MessageEmbed,
    Guild,
    CommandInteraction,
    GuildMember,
} from "discord.js";
import {
    CommandBuilder,
    PermissionCheckTypes,
    ParameterResolvable,
} from "./types.js";
import { MissingParameterError, PermissionsError } from "./errors.js";
import { Parameter } from "./Parameter.js";

//CLASSES
export class Command {
    name: string;
    parameters?: Parameter[];
    aliases?: string[];
    keywords?: string[];
    description: string;
    usage?: string;
    permissionCheck: PermissionCheckTypes;
    permissions?: Permissions;
    guilds?: Guild[];
    visible: boolean;
    private function: (
        interaction?: Message | CommandInteraction,
        cmdParams?: ParameterResolvable[]
    ) => void | string | MessageEmbed | Promise<void | string | MessageEmbed>;

    /**
     * Command constructor
     * @constructor
     * @param {CommandBuilder} options - all command properties
     * @param {string} options.name - command name (used to trigger the command)
     * @param {string | string[]} [options.aliases] - other words that can trigger the command with prefix
     * @param {string | string[]} [options.keywords] - other words that can trigger the command without prefix
     * @param {string} [options.description="No description"] - command description shown in the help message
     * @param {string} [options.usage] - command usage description shown in the help message
     * @param {PermissionCheckTypes} [options.permissionCheck='ANY'] - specifies if the caller has to have all of the specified permissions or any of that
     * @param {PermissionResolvable} [options.permissions] - permissions needed to run the command
     * @param {boolean} [options.visible=true] - show command in the help message
     * @param {Function} options.function - function that will trigger when the commands gets called
     */
    constructor(options: CommandBuilder) {
        this.name = options.name.split(" ").join("_");
        this.parameters = options.parameters
            ? options.parameters.map((p) => new Parameter(p))
            : undefined;
        this.aliases = Command.processPhrase(options.aliases);
        this.keywords = Command.processPhrase(options.keywords);
        this.description = options.description || "No description";
        this.usage = options.usage || this.generateUsageFromArguments();
        this.permissionCheck =
            options.permissionCheck == "ALL" || options.permissionCheck == "ANY"
                ? options.permissionCheck
                : "ANY";
        this.permissions = options.permissions
            ? new Permissions(options.permissions)
            : undefined;
        this.guilds = options.guilds;
        this.visible = options.visible != undefined ? options.visible : true;
        this.function = options.function;
        if (!/^[\w-]{1,32}$/.test(this.name)) {
            throw new Error(`Incorrect command name: ${this.name}`);
        }
        if (this.description.length > 100) {
            throw new Error("Command description is too long");
        }
    }

    /**
     * Starts the command
     * @param {Message} [message] - a *Message* object used to check caller's permissions. It will get passed to the execution function (specified in *function* property of command's constructor)
     * @param {string[]} [cmdParams] - list of processed parameters passed in a Discord message
     * @returns *Promise<void>*
     */
    async start(
        interaction?: Message | CommandInteraction,
        cmdParams?: ParameterResolvable[]
    ): Promise<void> {
        if (interaction instanceof Message) {
            const memberPermissions: Readonly<Permissions> =
                interaction?.member?.permissions || new Permissions();
            if (
                !this.permissions ||
                (this.permissionCheck == "ALL"
                    ? memberPermissions.has(this.permissions, true)
                    : memberPermissions.any(this.permissions, true))
            ) {
                let inputArguments: ParameterResolvable[] = cmdParams || [];
                if (this.parameters) {
                    this.parameters.map((a, i) => {
                        if (!inputArguments[i] && !a.optional) {
                            throw new MissingParameterError(a);
                        } else if (inputArguments[i]) {
                            inputArguments[i] = Parameter.process(
                                inputArguments[i] as string,
                                a.type
                            );
                        }
                    });
                }
                const fnResult = await this.function(interaction, cmdParams);
                if (typeof fnResult == "string") {
                    await interaction?.reply(fnResult);
                } else if (fnResult instanceof MessageEmbed) {
                    await interaction?.channel.send({ embeds: [fnResult] });
                }
            } else {
                throw new PermissionsError(this, interaction?.member);
            }
        } else if (interaction instanceof CommandInteraction) {
            const memberPermissions = interaction.member?.permissions;
            if (memberPermissions instanceof Permissions) {
                if (
                    !this.permissions ||
                    (this.permissionCheck === "ALL"
                        ? memberPermissions.has(this.permissions, true)
                        : memberPermissions.any(this.permissions, true))
                ) {
                    const fnResult = await this.function(
                        interaction,
                        cmdParams
                    );
                    if (typeof fnResult == "string") {
                        await interaction.reply(fnResult);
                    } else if (fnResult instanceof MessageEmbed) {
                        await interaction.reply({ embeds: [fnResult] });
                    } else if (!interaction.replied) {
                        try {
                            await interaction.reply({
                                embeds: [
                                    new MessageEmbed()
                                        .setColor("#00ff00")
                                        .setTitle(
                                            "✅ Task completed successfully"
                                        ),
                                ],
                            });
                        } catch (e) {
                            console.log(
                                "Cannot reply. The interaction has been closed"
                            );
                        }
                    }
                }
            } else {
                throw new PermissionsError(
                    this,
                    interaction.member as GuildMember
                );
            }
        }
    }

    toCommandObject() {
        let options: any[] = [];
        if (this.parameters) {
            options = this.parameters.map((p) => {
                let type = 3;
                if (!/^[\w-]{1,32}$/.test(p.name)) {
                    throw new Error(
                        `Failed to register ${p.name} parameter for ${this.name}: The option name is incorrect`
                    );
                }
                if ((p.description || "No description").length > 100) {
                    throw new Error(
                        `Failed to register ${p.name} parameter for ${this.name}: The description is too long`
                    );
                }
                if (p.type == "boolean") type = 5;
                else if (p.type == "user") type = 6;
                else if (p.type == "channel") type = 7;
                else if (p.type == "role") type = 8;
                else if (p.type == "mentionable") type = 9;
                else if (p.type == "number") type = 10;
                return {
                    name: p.name,
                    description: p.description || "No description",
                    required: !p.optional,
                    type: type,
                    choices: p.choices || [],
                };
            });
        }
        return {
            name: this.name,
            description: this.description,
            options: options,
        };
    }

    private static processPhrase(
        phrase?: string | string[]
    ): string[] | undefined {
        if (Array.isArray(phrase)) {
            const buff = phrase.map((p) => {
                return p.split(" ").join("_");
            });
            buff.map((e, i, a) => {
                if (e == "" || e == " ") {
                    a.splice(i, 1);
                }
            });
            return buff;
        } else if (typeof phrase == "string" && phrase != "" && phrase != " ") {
            const buff = [];
            buff.push(phrase.split(" ").join("_"));
            return buff;
        } else {
            return undefined;
        }
    }

    private generateUsageFromArguments(): string {
        let usageTemplate: string = "";
        this.parameters &&
            this.parameters.map((e) => {
                usageTemplate += `[${e.name} (${e.type}${
                    e.optional ? ", optional" : ""
                })] `;
            });
        return usageTemplate;
    }
}
