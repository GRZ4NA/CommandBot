import { Message } from 'discord.js';

interface CommandMessageStructure {
    name: string,
    arguments: string[]
}

class CommandMessage extends Message {
    command: CommandMessageStructure | null

    constructor(message: Message, prefix: string) {
        super(message.client, message, message.channel);
        if(!message.author.bot && message.content.startsWith(prefix)) {
            let msgContent = message.content.replace(prefix, '');
            const cmdName = msgContent.split(' ')[0];
            msgContent = msgContent.replace(cmdName, '');
            let cmdArguments: string[] = msgContent.split(',');
            cmdArguments = cmdArguments.map((a) => {
                return a.replace(' ', '');
            });
            this.command = {
                name: cmdName,
                arguments: cmdArguments
            }
        }
        else {
            this.command = null;
        }
    }
}

export { CommandMessage }