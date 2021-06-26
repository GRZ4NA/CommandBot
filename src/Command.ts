//IMPORTS
import { Permissions, PermissionResolvable, Message, GuildMember, MessageEmbed } from 'discord.js';

//TYPE DEFINITIONS
interface CommandBuilder {
    name: string,
    aliases?: string[] | string,
    keywords?: string[] | string,
    description?: string,
    usage?: string,
    permissions?: PermissionResolvable,
    visible?: boolean
    function: (message?: Message, cmdArguments?: string[]) => void | string | MessageEmbed;
}
interface CommandMessageStructure {
    name: string,
    arguments: string[],
    command: Command | null
}
type GetMode = 'ALL' | 'PREFIX' | 'NO_PREFIX';

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
    permissions: Permissions;
    visible: boolean;
    private function: (message?: Message, cmdArguments?: string[]) => void | string | MessageEmbed;

    constructor(options: CommandBuilder) {
        this.name = options.name.split(' ').join('_');
        this.aliases = Command.processPhrase(options.aliases);
        this.keywords = Command.processPhrase(options.keywords);
        this.description = options.description || "No description";
        this.usage = options.usage || "";
        this.permissions = new Permissions(options.permissions || 0);
        this.visible = options.visible != undefined ? options.visible : true;
        this.function = options.function;
    }
    async start(message?: Message, cmdArguments?: string[]) : Promise<void> {
        const memberPermissions : Readonly<Permissions> = message?.member?.permissions || new Permissions(0);
        if(memberPermissions.has(this.permissions, true)) {
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
            this.list.map((c) => {
                if(c.name == command.name) {
                    throw new Error(`Command with name "${c.name}" already exists!`);
                }
                command.aliases.map((a) => {
                    if(c.aliases.indexOf(a) != -1) {
                        console.warn(`WARN! Alias with name "${a}" already exists in "${c.name}" command. It will be removed from the "${command.name}" command`);
                        const iToRemove = command.aliases.indexOf(a);
                        command.aliases.splice(iToRemove, 1);
                    }
                });
                command.keywords.map((k) => {
                    if(c.keywords.indexOf(k) != -1) {
                        console.warn(`WARN! Keyword "${k}" already exists in "${c.name}" command. It will be removed from the "${command.name}" command`);
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
}

//EXPORTS
export { Command, CommandManager, CommandMessageStructure, PermissionsError }