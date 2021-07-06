# CommandBot

**2.0.0-beta3**

> [IMPORTANT]
> Upgrading to this version from 1.1.3 may require additional changes in your code since 2.0.0 is not fully backwards compatible

Discord.js framework that helps you build your own Discord bot.

Key features

-   command system
-   auto-generated help command
-   command permissions

## Table of contents

-   [Getting started](#getting-started)
    -   [Installation](#installation)
    -   [Creating bot instance](#creating-bot-instance)
-   [Bot instance](#bot-instance)
-   [Commands](#commands)
    -   [All parameters](#all-parameters)
    -   [Command function](#command-function)
        -   [Arguments](#arguments)
        -   [Return](#return)
        -   [Errors](#errors)
    -   [Command examples](#command-examples)
        -   [Simple reply](#simple-reply)
        -   [Example with arguments](#example-with-arguments)
-   [Events](#events)
-   [Customization and built-in messages](#customization-and-built-in-messages)
    -   [Help message](#help-message)
    -   [System messages](#system-messages)
-   [Complete example](#complete-example)

## Getting started

### Installation

1. Install this package using npm

```
npm install commandbot@latest
```

2. Add the following entry to your _package.json_ file

```json
"type": "module"
```

3. Import the package

```javascript
import { Bot, Command } from "commandbot";
```

### Creating bot instance

```javascript
const bot = new Bot({
    name: "Command bot", // Name of your bot
    prefix: "!", // Prefix used to call commands
    argumentSeparator: ",", // Used to get arguments from message (optional)
    clientOptions: undefined, // Instance of ClientOptions from Discord.js (optional)
    token: "", // Bot token from Discord Developer Portal (optional, you can pass the token in the *start* method)
});
```

Start your bot using

```javascript
bot.start();
```

Optional arguments for this method

-   **port** - _number_ - if specified, the app will create a http server that will be listening on the specified port
-   **token** - _string_ - app token from Discord Developer Portal

## Bot instance

The main object of this library has the following properties

-   **name** - _string_ - bot's name specified in the constructor
-   **client** - _[Client](https://discord.js.org/#/docs/main/stable/class/Client)_ - Discord.js client instance
-   **commands** - _CommandManager_ - base of the command system (see [Commands](#commands))
-   **config** - _object_ - object that stores the login token and _helpMessage_ value from the constructor
-   **messages** - _SystemMessageManager_ - object instance containing all configuration parameters for built-in messages (see [Customization and built-in messages](#customization-and-built-in-messages))

## Commands

> [IMPORTANT]
> All commands have to be declared above the _start_ method

### All parameters

-   **name** - _string_ - command name (used to trigger the command)
-   **function** - _Function_ - function that will trigger when the commands gets called
-   **visible** - _boolean_ - show command in the _help message_ (optional, defaults to _true_)
-   **description** - _string_ - command description shown in the _help message_ (optional)
-   **usage** - _string_ - command usage description shown in the _help message_ (optional)
-   **permissionCheck** - _"ALL" | "ANY"_ - specifies if the caller has to have all of the specified permissions or any of that (optional, default value: "ANY")
-   **permissions** - _[PermissionResolvable](https://discord.js.org/#/docs/main/stable/typedef/PermissionResolvable)_ - permissions needed to run the command (optional)
-   **aliases** - _string | string[]_ - other words that can trigger the command with prefix (optional)
-   **keywords** - _string | string[]_ - other words that can trigger the command without prefix (optional)

### Command function

#### Arguments

-   **m** - _[Message](https://discord.js.org/#/docs/main/stable/class/Message)_ - a message object instance containing message content, author and additional informations
-   **a** - _string[]_ - list of arguments passed with the message (splitted with _argumentSeparator_)

#### Return

If command function returns

-   _string_ - the returned text will be sent as a reply to the command caller
-   _[MessageEmbed](https://discord.js.org/#/docs/main/stable/class/MessageEmbed)_ - the embedded content will be sent as a standalone message

#### Errors

If your command throws an error, it will get logged to the console and sent to the user in a message with embedded content. **The bot will not crash.** ([Example](https://raw.githubusercontent.com/GRZ4NA/CommandBot/master/assets/error_example.png))

### Command examples

#### Simple reply

1. Create a command

```javascript
//CREATE COMMAND
const command = new Command({
    name: "ping",
    function: (m, a) => {
        return "pong";
    },
});
//APPEND IT TO THE COMMANDS LIST
bot.commands.add(command);
```

or

```javascript
bot.commands.add(
    new Command({
        name: "ping",
        function: (m, a) => {
            return "pong";
        },
    })
);
```

2. Call it from Discord text channel (example prefix: "!")

```
!ping

Result:
@mention, pong
```

#### Example with arguments

1. Create a command

```javascript
const command = new Command({
    name: "repeat",
    function: async (m, a) => {
        if (a[0] && a[1]) {
            const count = parseInt(a[1]);
            if (!isNaN(count)) {
                for (let i = 0; i < count; i++) {
                    await m.channel.send(a[0]);
                }
                return `Repeated "${a[0]}" ${count} times`;
            } else {
                throw new Error("Number of messages is incorrect");
            }
        }
    },
});
bot.commands.add(command);
```

or

```javascript
bot.commands.add(
    new Command({
        name: "repeat",
        function: async (m, a) => {
            if (a[0] && a[1]) {
                const count = parseInt(a[1]);
                if (!isNaN(count)) {
                    for (let i = 0; i < count; i++) {
                        await m.channel.send(a[0]);
                    }
                    return `Repeated "${a[0]}" ${count} times`;
                } else {
                    throw new Error("Number of messages is incorrect");
                }
            }
        },
    })
);
```

2. Call it from Discord text channel (example prefix: "!", example separator: "," [default])

```
!repeat test, 5

Result:
test
test
test
test
test
@caller, Repeated "test" 5 times
```

## Events

Events are emitted using built-in event emitter **(since version 2.0.0)**. You can handle them using _on_ property

-   **READY** - emitted when the client successfully connect to Discord API
-   **MESSAGE** - emitted for every message sent in any text channel (a [Message](https://discord.js.org/#/docs/main/stable/class/Message) object is passed to the first argument)
-   **COMMAND** - emitted for every message that gets recognized as a command (a [Message](https://discord.js.org/#/docs/main/stable/class/Message) object is passed to the first argument and a CommandMessageStructure object to the second argument)
-   **ERROR** - emitted on permission and command errors (an error object is passed to the first argument)
    > [IMPORTANT]
    > Do not use client.on('message') and client.on('ready') event handler! This handler is a core part of the command system.

Example

```javascript
bot.on("ready", () => {
    console.log("Bot is ready!");
});
```

## Customization and built-in messages

All configuration parameters for messages are stored in _messages_ property (example: bot.messages)

### Help message

Configuration parameters are stored in _messages.help_ property

-   **enabled** - _boolean_ - enables or disables the help message
-   **title** - _string_ - title of help message
-   **bottomText** - _string_ - text shown below the title
-   **color** - _[ColorResolvable](https://discord.js.org/#/docs/main/stable/typedef/ColorResolvable)_ - color of the embedded content
-   **description** - _string_ - command description (equivalent of the _description_ property in _Command_ object)
-   **usage** - _string_ - equivalent of the _usage_ property in _Command_ object (You can pass a command name, alias or keyword with the _help_ command to get detailed information about the specified command)

### System messages

All options are stored in _messages.system_ property

There are 3 types of system messages

-   Error message (**ERROR**)
-   Command not found message (**NOT_FOUND**)
-   Insufficient permissions message (**PERMISSION**)

Each message can be customized using these properties

-   **enabled** - _boolean_ - enables or disables the system message
-   **title** - _string_ - title of the message
-   **bottomText** - _string_ - text shown below the title
-   **accentColor** - _[ColorResolvable](https://discord.js.org/#/docs/main/stable/typedef/ColorResolvable)_ - color of the embedded content
-   **showTimestamp** - _boolean_ - show time and date at the bottom of the embedded content
-   **footer** - _string_ - footer of the embedded content

The _messages.system_ also contains a _deleteTimeout_ property. It specifies the time (in ms) after which a system message will be deleted. Set it to _Infinity_ to never delete messages (default value).

## Complete example

```javascript
import { Bot, Command } from "commandbot";

const bot = new Bot({
    name: "CommandBot",
    prefix: "!",
});

bot.messages.help.accentColor = "#ff0000";
bot.messages.system.NOT_FOUND.accentColor = "BLUE";

//Command triggers: !ping, !pong, pingpong
bot.commands.add(
    new Command({
        name: "ping",
        aliases: "pong",
        keywords: "pingpong",
        function: (m, a) => {
            return "Bot ping: " + bot.client.ws.ping + "ms";
        },
    })
);
bot.commands.add(
    new Command({
        name: "repeat",
        function: async (m, a) => {
            if (a[0] && a[1]) {
                const count = parseInt(a[1]);
                if (!isNaN(count)) {
                    for (let i = 0; i < count; i++) {
                        await m.channel.send(a[0]);
                    }
                    return `Repeated "${a[0]}" ${count} times`;
                } else {
                    throw new Error("Number of messages is incorrect");
                }
            }
        },
    })
);

bot.start(3000, "TOKEN");
```
