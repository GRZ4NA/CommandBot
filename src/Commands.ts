import { Permissions, PermissionResolvable } from 'discord.js';

interface CommandBuilder {
    name: string,
    aliases?: string[] | string,
    keywords?: string[] | string,
    description?: string,
    usage?: string,
    permissions: PermissionResolvable
}

class Command {
    name: string;
    aliases: string[];
    keywords: string[];
    description: string;
    usage: string;
    permissions: Permissions;

    constructor(options: CommandBuilder) {
        this.name = options.name.split(' ').join('_');
        this.aliases = [];
        if(options.aliases) {
            this.aliases = ProcessPhrase(options.aliases);
        }
        this.keywords = [];
        if(options.keywords) {
            this.keywords = ProcessPhrase(options.keywords);
        }
        this.description = options.description || "No description";
        this.usage = options.usage || "-";
        this.permissions = new Permissions(options.permissions);
    }
}
class CommandsManager {
    list: Command[];

    constructor() {
        this.list = [];
    }
    get(name: string) : Command | undefined {
        let command : Command | undefined = undefined;
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
}

function ProcessPhrase(phrase: string | string[]) : string[] {
    if(Array.isArray(phrase)) {
        const buff = phrase.map((p) => {
            return p.split(' ').join('_');
        });
        return buff;
    }
    else {
        const buff = [];
        buff.push(phrase.split(' ').join('_'));
        return buff;
    }
}

export { Command, CommandsManager }