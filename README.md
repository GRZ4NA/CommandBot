# DiscordCommands
**1.0.0**

Discord.js wrapper that helps you build your own Discord bot.

Key features
- command system
- auto-generated help command
- command permissions

## Table of contents
- [Getting started](#getting-started)
    + [Installation](#installation)
    + [Creating bot instance](#creating-bot-instance)
- [Commands](#commands)
    + [All parameters](#all-parameters)
    + [Command function](#command-function)
        * [Arguments](#arguments)
        * [Return](#return)
        * [Errors](#errors)
    + [Command examples](#command-examples)
        * [Simple reply](#simple-reply)
        * [Arguments example](#arguments-example)

## Getting started
### Installation
1. Install this package using npm
```
npm install discordcommands@latest
```

2. Add the following entry to your *package.json* file
```json
"type": "module"
```

3. Import the package
```javascript
import { Bot, Command } from 'discordcommands'
```
### Creating bot instance
```javascript
const bot = new Bot({
    name: "Command bot", // Name of your bot
    prefix: "!", // Prefix used to call commands
    argumentSeparator: "," // Used to get arguments from message
    helpCommand: true, // Enable or disable the *help* command (optional)
    clientOptions: undefined, // Instance of ClientOptions from Discord.js
    token: "" // Bot token from Discord Developer Portal (optional, you can pass the token in *start* method)
});
```

Start your bot using
```javascript
bot.start();
```
Optional arguments for this method
- **port** - *number* - if specified, the app will create a http server that will be listening on the specified port
- **token** - *string* - app token from Discord Developer Portal
## Commands
> [IMPORTANT]
> All commands have to be declared above the *start* method
### All parameters
- name - *string* - command name (used to trigger the command)
- function - *Function* - function that will trigger when the commands gets called
- visible - *boolean* - show command in the *help message* (optional, defaults to *true*)
- description - *string* - command description shown in the *help message* (optional)
- usage - *string* - command usage description shown in the *help message* (optional)
- permissions - *[PermissionResolvable](https://discord.js.org/#/docs/main/stable/typedef/PermissionResolvable)* - permissions needed to run the command (optional)
- aliases - *string | string[]* - other words that can trigger the command with prefix (optional)
- keywords - *string | string[]* - other words that can trigger the command without prefix (optional)
### Command function
#### Arguments
- m - *[Message](https://discord.js.org/#/docs/main/stable/class/Message)* - a message object instance containing message content, author and additional informations
- a - *string[]* - list of arguments passed with the message (separated with *argumentSeparator*)
#### Return
If command function returns
- *string* - the returned text will be sent as a reply to the command caller
- *[MessageEmbed](https://discord.js.org/#/docs/main/stable/class/MessageEmbed)* - the embedded content will be sent as a standalone message
#### Errors
If your command throws an error, it will get logged to the console and sent to the user in a message with embedded content. **The bot will not crash.** ([Example](https://raw.githubusercontent.com/GRZ4NA/DiscordCommands/master/assets/error_example.png))

### Command examples
#### Simple reply
1. Create a command
```javascript
//CREATE COMMAND
const command = new Command({
    name: "ping",
    function: (m, a) => {
        return 'pong';
    }
});
//APPEND IT TO THE COMMANDS LIST
bot.commands.add(command);
```
or
```javascript
bot.commands.add(new Command({
    name: "ping",
    function: (m, a) => {
        return 'pong';
    }
}));
```
2. Call it from Discord text channel (example prefix: "!")
```javascript
!ping // replies "pong" with the user mention
```
#### Arguments example
1. Create a command
```javascript
const command = new Command({
    name: "repeat",
    function: async (m, a) => {
        if(a[0] && a[1]) {
            const count = parseInt(a[1]);
            if(!isNaN(count)) {
                for(let i = 0; i < count; i++) {
                    await m.channel.send(a[0]);
                }
                return `Repeated "${a[0]}" ${count} times`;
            }
            else {
                throw new Error('Number of messages is incorrect');
            }
        }
    }
})
```
or
```javascript
bot.commands.add(new Command({
    name: "repeat",
    function: async (m, a) => {
        if(a[0] && a[1]) {
            const count = parseInt(a[1]);
            if(!isNaN(count)) {
                for(let i = 0; i < count; i++) {
                    await m.channel.send(a[0]);
                }
                return `Repeated "${a[0]}" ${count} times`;
            }
            else {
                throw new Error('Number of messages is incorrect');
            }
        }
    }
}));
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