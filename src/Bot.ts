//IMPORTS
import { Client, ClientOptions, Message } from 'discord.js';
import { Command, CommandsManager } from './Commands';
import { HelpMessage, HelpMessageParams } from './Help';
import { CommandMessage } from './CommandMessage';
import * as http from 'http';

//TYPE DEFINITIONS
interface ConfigurationOptions {
    prefix: string,
    accentColor: string,
    token?: string
}
interface ConstructorOptions {
    name: string,
    prefix: string,
    helpCommand?: boolean,
    clientOptions?: ClientOptions,
    token?: string,
    accentColor?: string
}

//MAIN CLASS
class Bot {
    name: string;
    client: Client;
    commands: CommandsManager;
    config: ConfigurationOptions;
    messages: {
        help: HelpMessageParams
    }
    on: {
        message: (m: Message) => any,
        command: (m: CommandMessage) => any
    }

    constructor(options: ConstructorOptions) {
        this.name = options.name;
        this.client = new Client(options.clientOptions);
        this.commands = new CommandsManager();
        this.config = {
            prefix: options.prefix,
            accentColor: "#000",
            token: options.token
        }
        this.messages = {
            help: {
                title: 'Help',
                description: 'List of all available commands',
                color: '#000',
                usage: '[command name (optional)]',
                bottomText: 'List of all available commands'
            }
        }
        this.on = {
            message: (m: Message) => {},
            command: (m: CommandMessage) => { console.log(m.command); }
        }
    }
    async start(port?: number, token?: string) : Promise<boolean> {
        try {
            console.log(`Bot name: ${this.name}`);
            const loginToken: string = token || this.config.token || '';
            if(loginToken === '') {
                throw new ReferenceError('No token specified. Please pass your Discord application token as an argument to the "start" method or in the constructor');
            }
            if(port) {
                console.log(`Creating http server on port ${port}...`);
                http.createServer().listen(port);
            }
            console.log('Starting modules...');
            const helpMsg: Command = new HelpMessage(this.commands, this.messages.help, this.config.prefix, this.name);
            this.commands.add(helpMsg);
            console.log('Connecting to Discord...');
            if(await this.client.login(token)) {
                console.log('BOT IS READY!\n');
                this.client.on('message', (m) => {
                    this.on.message(m);
                    const cmdMsg: CommandMessage = new CommandMessage(m, this.config.prefix);
                    if(cmdMsg.command) {
                        this.on.command(cmdMsg);
                        const calledCommand = this.commands.get(cmdMsg.command.name);
                        if(calledCommand) {
                            calledCommand.start(cmdMsg);
                        }
                    }
                });
            }
            else {
                return false;
            }
            return true;
        }
        catch (e) {
            console.error(`ERROR! ${e.toString()}`);
            return false;
        }
    }
}

//EXPORTS
export default Bot;
export { Bot };