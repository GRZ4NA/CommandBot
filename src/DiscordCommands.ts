//IMPORTS
import { Client, ClientOptions } from 'discord.js';

//TYPE DEFINITIONS
interface ConstructorOptions {
    name: string,
    prefix: string,
    helpCommand?: boolean,
    clientOptions?: ClientOptions
}

//MAIN CLASS
class Bot {
    name: string;
    client: Client;
    constructor(options: ConstructorOptions) {
        this.name = options.name;
        this.client = new Client(options.clientOptions);
    }
}