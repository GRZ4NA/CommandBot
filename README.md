# CommandBot

> **WARNING!** Documentation has not been completed yet!

> **WARNING!** This version uses Discord.js 13 which requires Node.js 16.6.0 or newer

> **WARNING!** This is a very early version of this package. A lot of things may not work as intended and some names, properties or variables might get added or removed without worrying about backwards compatibility previous beta editions. This version is not compatible with CommandBot 2 at all. If you notice any issues please report them in the Issues tab

## Example code

```javascript
const bot = new Bot({
    name: "Command Bot",
    prefix: "!", // for text commands
    token: "BOT_TOKEN",
    applicationId: "APPLICATION_ID",
});

bot.commands.add(new Command(
    name: 'hello',
    description: 'Greets the user',
    parameters: [
        {
            name: 'name',
            type: 'string',
            optional: false
        }
    ],
    function: (p, m) => {
        return `Hello ${p('name')} from ${m.member.toString()}`;
    }
));

bot.on("READY", () => {
    console.log('BOT IS READY!');
});

bot.start(3000, true /*Register slash commands*/);
```

## Discord usage

```
/hello name:World
or
!hello World

Response:
Hello World from @USER
```
