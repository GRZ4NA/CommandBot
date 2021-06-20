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
    arguments: string[]
}

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
        this.visible = options.visible || true;
        this.function = options.function;
    }
    async start(message?: Message, cmdArguments?: string[]) {
        const memberPermissions : Readonly<Permissions> = message?.member?.permissions || new Permissions(0);
        if(memberPermissions.any(this.permissions, true)) {
            await this.function(message, cmdArguments);
        }
        else {
            throw new PermissionsError(this, message?.member);
        }
    }
    static processPhrase(phrase?: string | string[]) : string[] {
        if(Array.isArray(phrase)) {
            const buff = phrase.map((p) => {
                return p.split(' ').join('_');
            });
            return buff;
        }
        else if(typeof phrase == 'string') {
            const buff = [];
            buff.push(phrase.split(' ').join('_'));
            return buff;
        }
        else {
            return [];
        }
    }
}
class CommandsManager {
    list: Command[];

    constructor() {
        this.list = [];
    }
    get(name: string) : Command | null {
        let command : Command | null = null;
        this.list.map((c) => {
            if(c.name == name) {
                command = c;
            }
        });
        return command;
    }
    add(command: Command) : boolean {
        try {
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
    fetch(message: Message, prefix: string) : CommandMessageStructure | null {
        if(!message.author.bot && message.content.startsWith(prefix)) {
            let msgContent = message.content.replace(prefix, '');
            const cmdName = msgContent.split(' ')[0];
            msgContent = msgContent.replace(cmdName, '');
            let cmdArguments: string[] = msgContent.split(',');
            cmdArguments = cmdArguments.map((a) => {
                return a.replace(' ', '');
            });
            return {
                name: cmdName,
                arguments: cmdArguments
            }
        }
        else {
            return null;
        }
    }
}

//EXPORTS
export { Command, CommandsManager, CommandMessageStructure }