//IMPORTS
import { Client, ClientOptions, Message } from 'discord.js';
import { Command, CommandsManager, CommandMessageStructure, PermissionsError } from './Command.js';
import { HelpMessage, HelpMessageParams } from './Help.js';
import * as http from 'http';
import { SystemMessageManager } from './SystemMessage.js';

//TYPE DEFINITIONS
interface ConfigurationOptions {
    prefix: string,
    token?: string
}
interface ConstructorOptions {
    name: string,
    prefix: string,
    helpCommand?: boolean,
    clientOptions?: ClientOptions,
    token?: string,
}

//MAIN CLASS
class Bot {
    name: string;
    client: Client;
    commands: CommandsManager;
    config: ConfigurationOptions;
    messages: {
        help: HelpMessageParams,
        system: SystemMessageManager
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
            token: options.token
        }
        this.messages = {
            help: {
                title: 'Help',
                description: 'List of all available commands',
                color: '#ff5500',
                usage: '[command name (optional)]',
                bottomText: 'List of all available commands'
            },
            system: new SystemMessageManager(this.name)
        }
        this.on = {
            message: (m: Message) => {},
            command: (m: Message, cmdInfo?: CommandMessageStructure) => { console.log(cmdInfo); }
        }
    }
    async start(port?: number, token?: string) : Promise<boolean> {
        try {
            console.log(`Bot name: ${this.name}`);
            console.log(`Prefix: ${this.config.prefix} \n`);
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
                    if(cmdMsg?.command) {
                        this.on.command(m, cmdMsg);
                        try {
                            await cmdMsg.command.start(m, cmdMsg.arguments);   
                        }
                        catch (e) {
                            if(e instanceof PermissionsError) {
                                this.messages.system.send('PERMISSION', { user: m.member || undefined, command: cmdMsg.command }, m.channel);
                            }
                            else {
                                this.messages.system.send('ERROR', { command: cmdMsg.command, user: m.member || undefined, error: e }, m.channel);
                            }
                            return;
                        }
                    }
                    else if(cmdMsg) {
                        this.messages.system.send('NOT_FOUND', { phrase: m.content, user: m.member || undefined }, m.channel);
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
export { Bot, Command };