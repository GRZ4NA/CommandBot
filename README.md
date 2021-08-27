# CommandBot

A Discord.js based framework that makes creating Discord bots easy and fast.

# Table of contents

-   [Instalation](#installation)
    -   [System requirements](#system-requirements)
    -   [Creating a project](#creating-a-project)
        -   [Registering Discord app](#registering-discord-app)
        -   [Creating application](#creating-application)
-   [Commands](#commands)
    -   [Creating and registering a command](#creating-and-registering-a-command)
    -   [Parameters](#parameters)
        -   [Types](#types)
        -   [Defining](#defining)
        -   [Reading input value](#reading-input-value)

# Installation

## System requirements

-   _Node.js_ 16.6.0 or newer
-   _npm_ or _yarn_ package manager

## Creating a project

### Registering Discord app

1. Visit [Discord Developer Portal](https://discord.com/developers/) and create an app
2. Navigate to the _Bot_ section and register a bot
3. Navigate to _OAuth 2_ section, select _bot_ and _application.commands_ scopes and check bot permissions
4. Copy the link and add your bot to the servers

### Creating application

1. Create empty directory
2. Run `npm init -y` or `yarn init -y`
3. Add the CommandBot package

```javascript
// npm
npm install commandbot@latest

// yarn
yarn add commandbot@latest
```

4. Create _index.js_ file
5. Import the CommandBot package

```javascript
// CommonJS
const { Bot, Command } = require("commandbot");

// ES Modules (to use ESM add "type": "module" to your package.json file)
import { Bot, Command } from "commandbot";
```

6. Initialize the bot instance

```javascript
const bot = new Bot({
    name: "YOUR_BOT_NAME",
    prefix: "BOT_PREFIX",
    parameterSeparator: ",",
    clientOptions: {
        intents: [..."DISCORD_API_INTENTS"],
    },
    token: "DISCORD_BOT_TOKEN",
    applicationId: "APPLICATION_ID",
});
```

Properties (\* - required):

-   **name\*** - _string_ - bot name
-   **prefix** - _string_ - bot prefix to use with text commands (if undefined, only slash commands will be available)
-   **parameterSeparator** - _string_ - used to separate parameters from messages (default: ',')
-   **clientOptions** - _[ClientOptions](https://discord.js.org/#/docs/main/stable/typedef/ClientOptions)_ - Discord.js client options
-   **token\*** - _string_ - Discord bot token
-   **applicationId\*** - _string_ - Discord application ID

7. Create and add commands to the _Bot_ instance (see [Commands](#commands))
8. Start your bot

```javascript
bot.start(
    port, // If passed, the application will create a HTTP server
    true // If true or undefined, the app will register all slash commands in the Discord API
);
```

# Commands

## Creating and registering a command

To create a command, initialize a _Command_ object

Example:

```javascript
const cmdGreet = new Command({
    name: "greet",
    parameters: [
        {
            name: "name",
            description: "Name that will be greeted",
            optional: true,
            type: "string",
        },
    ],
    aliases: ["hello"],
    description: "Welcomes someone",
    usage: "[name]",
    permissionCheck: "ALL",
    permissions: ["SEND_MESSAGES"],
    guilds: undefined,
    visible: true,
    slash: true,
    annouceSuccess: true,
    function: function(p. m) {
        if(p('name')) {
            return `Hello, ${p('name')}!`
        }
        else {
            return 'Hello!'
        }
    }
});

// Register
bot.commands.add(cmdGreet)
```

Properties (\* - required):

-   **name\*** - _string_ - command name
-   **parameters** - _ParameterSchema[]_ - array of parameters (see [Parameters](#parameters))
-   **aliases** - _string | string[]_ - array of alternative strings that can call this command (not available for slash commands)
-   **description** - _string_ - command description
-   **usage** - _string_ - command usage visible in the help message (if not defined, usage string will be automatically generated based on defined parameters)
-   **permissionCheck** - _"ALL" | "ANY"_ - whether to check if caller has all defined permission or at least one of them
-   **permissions** - _[PermissionResolvable](https://discord.js.org/#/docs/main/stable/typedef/PermissionResolvable) | (m?: [Message](https://discord.js.org/#/docs/main/stable/class/Message) | [CommandInteraction](https://discord.js.org/#/docs/main/stable/class/CommandInteraction)) => boolean_ - permissions required to run this command
-   **guilds** - _string[]_ - array of servers IDs in which this command will be available (if slash command)
-   **visible** - _boolean_ - whether this command is visible in the help message
-   **slash** - _boolean_ - whether this command should be registered as a slash command
-   **announceSuccess** - _boolean_ - whether a command reply should be sent automatically if no other response is defined or the reply should be deleted
-   **function\*** - _(p: function, m?: [Message](https://discord.js.org/#/docs/main/stable/class/Message) | [CommandInteraction](https://discord.js.org/#/docs/main/stable/class/CommandInteraction)) => void | [MessageEmbed]() | string | [ReplyMessageOptions](https://discord.js.org/#/docs/main/stable/typedef/ReplyMessageOptions)_ - function that will be executed on call
    -   Arguments
    -   -   **p** - _function_ - call this function with parameter name to fetch parameter value
        -   **m?** - _[Message](https://discord.js.org/#/docs/main/stable/class/Message) | [CommandInteraction](https://discord.js.org/#/docs/main/stable/class/CommandInteraction)_ - interaction object

Register your command in bot client using:

```javascript
bot.commands.add(cmd);
```

where (\* - required):

-   **cmd** - _Command_

## Parameters

### Types

-   **string** - text value
-   **boolean** - True or False
-   **number** - number (double) value
-   **user** - _ObjectID_ object with ID value (shown as selection menu in Discord)
-   **role** - _ObjectID_ object with ID value (shown as selection menu in Discord)
-   **channel** - _ObjectID_ object with ID value (shown as selection menu in Discord)
-   **mentionable** - _ObjectID_ object with ID value (shown as selection menu in Discord)

To get an entity ID from _ObjectID_ use the _value_ property. You can also call _toObject_ method to retrieve full entity object from Discord API

```javascript
ObjectID.toObject(g, "TYPE");
```

where (\* - required):

-   **g\*** - _Guild_ - Guild object to fetch from
-   **"TYPE"\*** - _"user' | "role" | "channel"_ - defines the entity type

### Defining

Example:

```javascript
{
    name: "user",
    description: "User to mention",
    optional: false,
    type: "user"
}
```

Properties (\* - required):

-   **name\*** - _string_ - parameter name
-   **description** - _string_ - parameter description
-   **optional\*** - _boolean_ - whether this parameter is optional
-   **type\*** - _"string" | "boolean" | "number" | "user" | "role" | "channel" | "mentionable"_ - parameter type
-   **choices** - _string[]_ - parameter value choices (to use this, set type to "string")

### Reading input value

To read parameter values use a function that is passed in the first argument of a call function (defined in _function_ parameter in _Command_ object)

```javascript
p(query, returnType);
```

where (\* - required):

-   **query\*** - _string_ - parameter name
-   **returnType** - _"value" | "object"_ - whether to return only parameter value or a full object

```javascript
function: (p, m) => {
    const userObj = p('user')
    if(userObj) {
        const user = user.toObject(m.guild, "user");
        if(user) {
            return `Hello, ${user.toString()}`
        }
        else {
            throw new Error('User not found')
        }
    }
}
```
