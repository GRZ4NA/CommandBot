# CommandBot

A Discord.js based framework that makes creating Discord bots with support for slash commands easy and fast.

## Features

-   Support for slash commands, context menu interactions
-   Intuitive usage
-   Flexible
-   Good customization
-   Permission system
-   Built-in help command
-   Built-in information messages
-   Automatic error catching
-   Large documentation in README and using JSDoc
-   Written in TypeScript

## Documentation

Reference for available objects and structures is available [**here**](https://grz4na.github.io/commandbot/index.html). All descriptions can also be accessed from your code editor/IDE. TypeScript declaration files are also included (.d.ts) for some programs (like Visual Studio Code) to give autocompletion suggestions.

## Table of contents

-   [CommandBot](#commandbot)
    -   [Features](#features)
    -   [Documentation](#documentation)
    -   [Table of contents](#table-of-contents)
-   [Instalation](#installation)
    -   [System requirements](#system-requirements)
    -   [Creating a project](#creating-a-project)
        -   [Registering Discord app](#registering-discord-app)
        -   [Creating application](#creating-application)
-   [Commands](#commands)
    -   [Creating a command](#creating-a-command)
    -   [Parameters](#parameters)
        -   [Types](#types)
        -   [Defining](#defining)
        -   [Reading input value](#reading-input-value)
-   [Events](#events)
-   [Messages](#messages)
    -   [System messages](#system-messages)
    -   [Help message](#help-message)
-   [Issues](#issues)

# Installation

## System requirements

-   _Node.js_ 16.6.0 or newer
-   _npm_ or _yarn_ package manager

## Creating a project

### Registering Discord app

1. Visit [Discord Developer Portal](https://discord.com/developers/) and create an app
2. Navigate to the _Bot_ section and register a bot
3. Navigate to _OAuth 2_ section, select _bot_ and _application.commands_ scopes and check bot permissions
4. Copy the link, paste it in your web browser and add the bot to a server

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

4. Create _index.js/index.ts_ file (TypeScript is a recommended language)
5. Import the CommandBot package

```javascript
// CommonJS
const { Bot } = require("commandbot");

// ES Modules (to use ESM add "type": "module" to package.json file)
import { Bot } from "commandbot";
```

6. Initialize the bot instance ([InitOptions](https://grz4na.github.io/commandbot/interfaces/InitOptions.html)) (list of available intents [here](https://discord.js.org/#/docs/main/stable/class/Intents?scrollTo=s-FLAGS))

```javascript
const bot = new Bot({
    name: "YOUR_BOT_NAME",
    globalPrefix: "!",
    argumentSeparator: ",",
    commandSeparator: "/",
    clientOptions: {
        intents: [..."DISCORD_API_INTENTS"],
    },
    token: "DISCORD_BOT_TOKEN",
    applicationId: "APPLICATION_ID",
});
```

7. Create and add commands to the _Bot_ instance (see [Commands](#commands))
8. Start your bot

```javascript
bot.start(
    port, // If passed, the application will create a HTTP server [type: number (integer)]
    true // If true or undefined, the app will register all slash commands in the Discord API [type: boolean]
);
```

> **WARNING!** All commands have to be added to the instance **before starting the bot**. Adding commands while the bot is running is not possible and can cause issues.

# Commands

## Creating a command

To create a command, use _[CommandManager.prototype.add](https://grz4na.github.io/commandbot/classes/CommandManager.html#add)_ method

Command types

-   [CHAT](https://grz4na.github.io/commandbot/interfaces/ChatCommandInit.html) - message interactions using command prefixes or slash commands
-   [USER](https://grz4na.github.io/commandbot/interfaces/ContextMenuCommandInit.html) - right-click context menu interactions on users
-   [MESSAGE](https://grz4na.github.io/commandbot/interfaces/ContextMenuCommandInit.html) - right-click context menu interactions on messages

Chat command example:

```javascript
bot.commands.add("CHAT", {
    name: "greet",
    parameters: [
        {
            name: "user",
            description: "User to greet",
            optional: false,
            type: "user",
        },
    ],
    aliases: ["hello"],
    description: "Welcome someone to your server",
    usage: "[user]",
    dm: false,
    guilds: ["123456789874561230"],
    slash: true,
    visible: true,
    permissions: {
        resolvable: ["ADMINISTRATOR"],
        checkType: "ANY",
    },
    function: async (i) => {
        const user = await i.get("user").toObject();
        return `Hello ${user.toString()}`;
    },
});
```

Command function schema is defined **[here](https://grz4na.github.io/commandbot/modules.html#CommandFunction)**

## Parameters

### Types

-   [primitive](https://grz4na.github.io/commandbot/modules.html#ParameterType)
-   [objects](https://grz4na.github.io/commandbot/modules.html#ObjectIdType)

To get an entity ID from _ObjectID_ use the _[id](https://grz4na.github.io/commandbot/classes/ObjectID.html#id)_ property. You can also call _[toObject](https://grz4na.github.io/commandbot/classes/ObjectID.html#toObject)_ method to retrieve full entity object from Discord API

### Defining

Pass a list of _[ParameterSchema](https://grz4na.github.io/commandbot/interfaces/ParameterSchema.html)_ objects to _[parameters](https://grz4na.github.io/commandbot/interfaces/ChatCommandInit.html#parameters)_ property

Example parameter object:

```javascript
{
    name: "user",
    description: "User to mention",
    optional: false,
    type: "user"
}
```

### Reading input value

To read parameter values use _[InputManager.prototype.get()](https://grz4na.github.io/commandbot/classes/InputManager.html#get)_ (passed in the first argument of a command function)

Example:

```javascript
function: (i) => {
    const userObj = i.get('member', 'user')
    if(userObj) {
        const user = userObj.toObject();
        if(user) {
            return `Hello, ${user.toString()}`
        }
        else {
            throw new Error('User not found')
        }
    }
}
```

# Events

CommandBot is using _[EventEmitter](https://nodejs.org/api/events.html)_ that is built into Node.js. You can listen to events using the _[on](https://grz4na.github.io/commandbot/classes/Bot.html#on-1)_ method. Event types are available **[here](https://grz4na.github.io/commandbot/classes/Bot.html#on-1)**.

# Messages

## System messages

System messages can be composed and sent automatically when a certain action happens. All message types are available **[here]()**. Their configuration is stored in _[Bot.prototype.messages.system](https://grz4na.github.io/commandbot/classes/Bot.html#messages)_ property. Each of these messages can be customized with _[SystemMessageAppearance](https://github.com/GRZ4NA/CommandBot/issues/interfaces/SystemMessageAppearance.html)_ objects. There is also a global _[deleteTimeout](https://grz4na.github.io/commandbot/classes/SystemMessageManager.html#deleteTimeout)_ property so messages can automatically be deleted after a given time.

## Help message

Its configuration is stored in _[Bot.prototype.messages.help](https://grz4na.github.io/commandbot/classes/Bot.html#messages)_ property and can be customized with _[HelpMessageParams](https://grz4na.github.io/commandbot/interfaces/HelpMessageParams.html)_ object.

> **WARNING!** You can't customize these messages after starting the bot. Changing these properties while the bot is running will have no effect.

# Issues

Since this package is created by only 1 person it may contain some bugs or behave weirdly. If you notice any problem, typo etc, please create an issue in the _[Issues](https://github.com/GRZ4NA/CommandBot/issues)_ tab on GitHub.

Thank you.

Created with ❤️ by [GRZANA](https://github.com/GRZ4NA)
