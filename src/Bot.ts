//IMPORTS
import { Client, ClientOptions } from 'discord.js';
import { CommandsManager } from './Commands';

//TYPE DEFINITIONS
interface ConfigurationOptions {
    prefix: string,
    accentColor: string
}
interface ConstructorOptions {
    name: string,
    prefix: string,
    helpCommand?: boolean,
    clientOptions?: ClientOptions,
    token?: string
}

//MAIN CLASS
class Bot {
    name: string;
    client: Client;
    commands: CommandsManager;
    config: ConfigurationOptions;

    constructor(options: ConstructorOptions) {
        this.name = options.name;
        this.client = new Client(options.clientOptions);
        this.commands = new CommandsManager();
        this.config = {
            prefix: options.prefix,
            accentColor: "#000"
        }
    }
}

//EXPORTS
export default Bot;
export { Bot };