//IMPORTS
import { Permissions, PermissionResolvable, Message, GuildMember, MessageEmbed } from 'discord.js';

//TYPE DEFINITIONS
interface CommandBuilder {
    name: string,
    aliases?: string[] | string,
    keywords?: string[] | string,
    description?: string,
    usage?: string,
    permissionCheck?: PermissionCheckTypes,
    permissions?: PermissionResolvable,
    visible?: boolean
    function: (message?: Message, cmdArguments?: string[]) => void | string | MessageEmbed | Promise<void | string | MessageEmbed>;
}
interface CommandMessageStructure {
    name: string,
    arguments: string[],
    command: Command | null
}
interface PhraseOccurrenceData {
    command: Command,
    type: 'NAME' | 'ALIAS'
}
type GetMode = 'ALL' | 'PREFIX' | 'NO_PREFIX';
type PermissionCheckTypes = 'ALL' | 'ANY';

//ERROR CLASSES
class PermissionsError {
    private command: Command;
    private user: GuildMember | null;
    constructor(command: Command, user?: GuildMember | null) {
        this.command = command;
        this.user = user || null;
    }
    toString() {
        return `User ${this.user?.user.tag} doesn't have enough permissions to run "${this.command.name}" command`;
    }
}

//CLASSES
class Command {
    name: string;
    aliases: string[];
    keywords: string[];
    description: string;
    usage: string;
    permissionCheck: PermissionCheckTypes;
    permissions: Permissions;
    visible: boolean;
    private function: (message?: Message, cmdArguments?: string[]) => void | string | MessageEmbed | Promise<void | string | MessageEmbed>;

    constructor(options: CommandBuilder) {
        this.name = options.name.split(' ').join('_');
        this.aliases = Command.processPhrase(options.aliases);
        this.keywords = Command.processPhrase(options.keywords);
        this.description = options.description || "No description";
        this.usage = options.usage || "";
        this.permissionCheck = options.permissionCheck == 'ALL' || options.permissionCheck == 'ANY' ? options.permissionCheck : "ANY";
        this.permissions = new Permissions(options.permissions || 0);
        this.visible = options.visible != undefined ? options.visible : true;
        this.function = options.function;
    }
    async start(message?: Message, cmdArguments?: string[]) : Promise<void> {
        const memberPermissions : Readonly<Permissions> = message?.member?.permissions || new Permissions(0);
        if(this.permissionCheck == 'ALL' ? memberPermissions.has(this.permissions, true) : memberPermissions.any(this.permissions, true)) {
            const fnResult = await this.function(message, cmdArguments);
            if(typeof fnResult == 'string') {
                await message?.reply(fnResult);
            }
            else if(fnResult instanceof MessageEmbed) {
                await message?.channel.send(fnResult);
            }
        }
        else {
            throw new PermissionsError(this, message?.member);
        }
    }
    private static processPhrase(phrase?: string | string[]) : string[] {
        if(Array.isArray(phrase)) {
            const buff = phrase.map((p) => {
                return p.split(' ').join('_');
            });
            buff.map(e => {
                if(e == '' || e == ' ') {
                    const i = buff.indexOf(e);
                    buff.splice(i, 1);
                }
            });
            return buff;
        }
        else if(typeof phrase == 'string' && phrase != '' && phrase != ' ') {
            const buff = [];
            buff.push(phrase.split(' ').join('_'));
            return buff;
        }
        else {
            return [];
        }
    }
}
class CommandManager {
    list: Command[];
    prefix: string;
    argumentSeparator: string;

    constructor(prefix: string, argumentSeparator?: string) {
        this.list = [];
        this.prefix = prefix;
        this.argumentSeparator = argumentSeparator || ',';
    }
    get(phrase: string, mode?: GetMode) : Command | null {
        if(!mode) mode = 'ALL';
        let command : Command | null = null;
        this.list.map((c) => {
            switch (mode) {
                case 'PREFIX':
                    if(c.name == phrase) {
                        command = c;
                    }
                    c.aliases.map(a => {
                        if(a == phrase) {
                            command = c;
                        }
                    });
                    break;
                case 'NO_PREFIX':
                    c.keywords.map(k => {
                        if(k == phrase) {
                            command = c;
                        }
                    });
                    break;
                case 'ALL':
                    if(c.name == phrase) {
                        command = c;
                    }
                    c.aliases.map(a => {
                        if(a == phrase) {
                            command = c;
                        }
                    });
                    c.keywords.map(k => {
                        if(k == phrase) {
                            command = c;
                        }
                    });
                    break;
            }
        });
        return command;
    }
    add(command: Command) : boolean {
        try {
            if(!(command instanceof Command)) {
                throw new TypeError('Inavlid argument type');
            }
            const nameOccurrence: PhraseOccurrenceData | null = this.findPhraseOccurrence(command.name);
            if(nameOccurrence) {
                throw new Error(`The name "${command.name}" has already been registered as ${nameOccurrence.type} in the "${nameOccurrence.command.name}" command.`);
            }
            command.aliases.map(a => {
                const aliasOccurrence: PhraseOccurrenceData | null = this.findPhraseOccurrence(a);
                if(aliasOccurrence) {
                    console.warn(`WARN! The name "${a}" is already registered as ${aliasOccurrence.type} in the "${aliasOccurrence.command.name}" command. It will be removed from the "${command.name}" command.`);
                    const iToRemove = command.aliases.indexOf(a);
                    command.aliases.splice(iToRemove, 1);
                }
            });
            this.list.map(c => {
                command.keywords.map(k => {
                    if(c.keywords.indexOf(k) != -1) {
                        console.warn(`WARN! The name "${k}" is already a registered KEYWORD for the "${c.name}" command. It will be removed from the "${command.name}" command`);
                        const iToRemove = command.keywords.indexOf(k);
                        command.keywords.splice(iToRemove, 1);
                    }
                });
            });
            this.list.push(command);
            return true;  
        } 
        catch(e) {
            console.error(`ERROR! ${e.toString()}`);
            return false;
        }
    }
    fetch(message: Message) : CommandMessageStructure | null {
        if(!message.author.bot && message.content.startsWith(this.prefix)) {
            let msgContent = message.content.replace(this.prefix, '');
            const cmdName = msgContent.split(' ')[0];
            const cmd: Command | null = this.get(cmdName, 'PREFIX');
            msgContent = msgContent.replace(cmdName, '');
            let cmdArguments: string[] = msgContent.split(this.argumentSeparator);
            cmdArguments = cmdArguments.map((a) => {
                return a.replace(' ', '');
            });
            if((cmdArguments[0] == '' || cmdArguments[0] == ' ') && cmdArguments.length == 1) {
                cmdArguments = [];
            }
            return {
                name: cmdName,
                arguments: cmdArguments,
                command: cmd
            }
        }
        else if(!message.author.bot) {
            const cmdName = message.content.split(' ')[0];
            const cmd: Command | null = this.get(cmdName, 'NO_PREFIX');
            if(cmd) {
                const cmdArgumentsStr = message.content.replace(cmdName, '');
                let cmdArguments: string[] = cmdArgumentsStr.split(',');
                cmdArguments = cmdArguments.map((a) => {
                    return a.replace(' ', '');
                });
                if((cmdArguments[0] == '' || cmdArguments[0] == ' ') && cmdArguments.length == 1) {
                    cmdArguments = [];
                }
                return {
                    name: cmdName,
                    arguments: cmdArguments,
                    command: cmd
                }
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    }
    private findPhraseOccurrence(phrase?: string) : PhraseOccurrenceData | null {
        let returnValue: PhraseOccurrenceData | null = null;
        this.list.map(c => {
            if(phrase == c.name) {
                returnValue = {
                    command: c,
                    type: 'NAME'
                }
            }
            else if(c.aliases.indexOf(phrase || '') != -1) {
                returnValue = {
                    command: c,
                    type: 'ALIAS'
                }
            }
        });
        return returnValue;
    }
}

//EXPORTS
export { Command, CommandManager, CommandMessageStructure, PermissionsError }