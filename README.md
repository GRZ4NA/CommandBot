# CommandBot

A Discord.js based framework that makes creating Discord bots easy and fast.

# Table of contents

-   [Instalation](#installation)

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
    prefix: "BOT_PREFIX", // bot prefix (optional) (if undefined, only slash commands will be available)
    argumentSeparator: ",", // used to separate parameters from messages (optional)
    clientOptions: {
        intents: [..."DISCORD_API_INTENTS"],
    }, // Discord.js ClientOptions (optional)
    token: "DISCORD_BOT_TOKEN" // Discord bot token
    applicationId: "APPLICATION_ID" // Discord application ID used to register slash commands
});
```

Links

-   [DISCORD_API_INTENTS](https://discord.js.org/#/docs/main/stable/class/Intents)
-   [ClientOptions](https://discord.js.org/#/docs/main/stable/typedef/ClientOptions)

7. Create and add commands to the _Bot_ instance (see [Commands](#commands))
8. Start your bot

```javascript
bot.start(
    port, // If passed, the application will create a HTTP server
    true // If true, the app will register all slash commands in the Discord API (it's recommended setting it to false after registering to avoid reaching daily quota)
);
```
