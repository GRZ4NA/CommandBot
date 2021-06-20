//IMPORTS
import { Client, ClientOptions, Message } from 'discord.js';
import { Command, CommandsManager, CommandMessageStructure } from './Commands.js';
import { HelpMessage, HelpMessageParams } from './Help.js';
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
        command: (m: Message, cmdInfo?: CommandMessageStructure) => any
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
            command: (m: Message, cmdInfo?: CommandMessageStructure) => { console.log(cmdInfo); }
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
                this.client.on('message', async m => {
                    this.on.message(m);
                    const cmdMsg: CommandMessageStructure | null = this.commands.fetch(m, this.config.prefix);
                    if(cmdMsg) {
                        this.on.command(m, cmdMsg);
                        const calledCommand: Command | null = this.commands.get(cmdMsg.name);
                        if(calledCommand) {
                            try {
                                await calledCommand.start(m, cmdMsg.arguments);   
                            }
                            catch (e) {
                                console.error(`ERROR! ${e.toString()}`);
                                return;
                            }
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