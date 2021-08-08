//IMPORTS
import {
    Permissions,
    Message,
    MessageEmbed,
    CommandInteraction,
    GuildMember,
    ReplyMessageOptions,
} from "discord.js";
import {
    CommandBuilder,
    ParameterResolvable,
    PermissionCheckTypes,
} from "./types.js";
import { PermissionsError } from "./errors.js";
import { DefaultParameter, InputParameter, Parameter } from "./Parameter.js";

//CLASSES
export class Command {
    name: string;
    parameters: Parameter[];
    aliases?: string[];
    description: string;
    usage?: string;
    permissionCheck: PermissionCheckTypes;
    permissions?: Permissions;
    guilds?: string[];
    visible: boolean;
    private function: (
        params: (
            query: string,
            returnType?: "value" | "object"
        ) => ParameterResolvable | InputParameter | null,
        interaction?: Message | CommandInteraction
    ) =>
        | void
        | string
        | MessageEmbed
        | ReplyMessageOptions
        | Promise<void | string | MessageEmbed | ReplyMessageOptions>;

    /**
     * Command constructor
     * @constructor
     * @param {CommandBuilder} options - all command properties
     * @param {string} options.name - command name (used to trigger the command)
     * @param {string | string[]} [options.aliases] - other words that can trigger the command with prefix (not used in slash commands)
     * @param {string | string[]} [options.keywords] - other words that can trigger the command without prefix (not used in slash commands)
     * @param {string} [options.description="No description"] - command description shown in the help message
     * @param {string} [options.usage] - command usage description shown in the help message (usage message can be automatically generated using parameters)
     * @param {PermissionCheckTypes} [options.permissionCheck='ANY'] - specifies if the caller has to have all of the specified permissions or any of that
     * @param {PermissionResolvable} [options.permissions] - permissions needed to run the command
     * @param {boolean} [options.visible=true] - show command in the help message (visible as a slash command)
     * @param {Function} options.function - function that will trigger when the commands gets called
     */
    constructor(options: CommandBuilder) {
        this.name = options.name.split(" ").join("_");
        if (options.parameters == "no_input" || !options.parameters) {
            this.parameters = [];
        } else if (options.parameters == "simple") {
            this.parameters = [new DefaultParameter()];
        } else {
            this.parameters = options.parameters.map((ps) => new Parameter(ps));
        }
        this.aliases = Command.processPhrase(options.aliases);
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
        cmdParams?: InputParameter[]
    ): Promise<void> {
        const paramFindFn = function (
            query: string,
            returnType?: "value" | "object"
        ) {
            return returnType === "object"
                ? cmdParams?.find((p) => p.name === query) || null
                : cmdParams?.find((p) => p.name === query)?.value || null;
        };
        const memberPermissions: Readonly<Permissions> =
            (interaction?.member?.permissions as Permissions) ||
            new Permissions();
        if (
            !this.permissions ||
            (this.permissionCheck == "ALL"
                ? memberPermissions.has(this.permissions, true)
                : memberPermissions.any(this.permissions, true))
        ) {
            let placeholdingReply: boolean = false;
            if (interaction instanceof CommandInteraction) {
                setTimeout(async () => {
                    if (!interaction.replied) {
                        await interaction.reply({
                            embeds: [
                                new MessageEmbed()
                                    .setColor("#ffff00")
                                    .setTitle("🔄"),
                            ],
                        });
                        placeholdingReply = true;
                    }
                }, 1500);
            }
            const fnResult = await this.function.call(
                this,
                paramFindFn,
                interaction
            );
            if (
                fnResult instanceof Object &&
                ("content" in (fnResult as any) ||
                    "embeds" in (fnResult as any) ||
                    "files" in (fnResult as any) ||
                    "components" in (fnResult as any) ||
                    "sticker" in (fnResult as any))
            ) {
                if (interaction instanceof Message)
                    await interaction.reply(fnResult as ReplyMessageOptions);
                else if (interaction instanceof CommandInteraction)
                    interaction.replied
                        ? await interaction.editReply(
                              fnResult as ReplyMessageOptions
                          )
                        : await interaction.reply(
                              fnResult as ReplyMessageOptions
                          );
            } else if (typeof fnResult == "string") {
                if (interaction instanceof Message)
                    await interaction?.reply(fnResult);
                else if (interaction instanceof CommandInteraction)
                    interaction.replied
                        ? await interaction.editReply({
                              content: fnResult,
                              embeds: [],
                          })
                        : await interaction.reply({
                              content: fnResult,
                              embeds: [],
                          });
            } else if (fnResult instanceof MessageEmbed) {
                if (interaction instanceof Message)
                    await interaction?.channel.send({ embeds: [fnResult] });
                else if (interaction instanceof CommandInteraction)
                    interaction.replied
                        ? await interaction.editReply({ embeds: [fnResult] })
                        : await interaction.reply({ embeds: [fnResult] });
            } else if (
                interaction instanceof CommandInteraction &&
                (!interaction.replied || placeholdingReply)
            ) {
                await interaction.reply({
                    embeds: [
                        new MessageEmbed().setColor("#00ff00").setTitle("✅"),
                    ],
                });
            }
        } else {
            throw new PermissionsError(
                this,
                interaction?.member as GuildMember
            );
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
