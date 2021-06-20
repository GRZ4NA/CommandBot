import { Message, MessageEmbed } from 'discord.js';
import { Command, CommandsManager } from './Commands.js';

interface HelpMessageParams {
    title: string,
    bottomText: string
    color: string,
    description: string,
    usage: string
}

class HelpMessage extends Command {
    constructor(cmdManager: CommandsManager, params: HelpMessageParams, prefix: string, botName?: string) {
        super({
            name: 'help',
            usage: params.usage,
            permissions: 0,
            description: params.description,
            function: () => {
                const helpMsg = new MessageEmbed()
                if(helpMsg != null) {
                    helpMsg.setColor(params.color);
                    helpMsg.setDescription(params.bottomText);
                    helpMsg.setTimestamp();
                    helpMsg.setTitle(params.title);
                    helpMsg.setFooter(botName || '');

                    cmdManager.list.map((c) => {
                        if(c.visible) {
                            helpMsg.addField(
                                `${prefix}${c.name} ${c.usage}`,
                                c.description,
                                false
                            )
                        }
                    });
                }
                return helpMsg;
            }
        });
    }
}

export { HelpMessage, HelpMessageParams };