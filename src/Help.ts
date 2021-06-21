import { ColorResolvable, MessageEmbed } from 'discord.js';
import { Command, CommandsManager } from './Command.js';

interface HelpMessageParams {
    title: string,
    bottomText: string
    color: ColorResolvable,
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
            function: (m, a) => {
                const helpMsg = new MessageEmbed()
                helpMsg.setColor(params.color);
                helpMsg.setTimestamp();
                helpMsg.setFooter(botName || '');
                if(helpMsg != null) {
                    if(a && a[0]) {
                        const cmd: Command | null = cmdManager.get(a[0], 'ALL');
                        if(cmd) {
                            helpMsg.setTitle(`${cmd.name} ${cmd.visible ? '' : '[HIDDEN]'}`);
                            helpMsg.setDescription(cmd.description);
                            if(cmd.usage) helpMsg.addField('Usage:', `${prefix}${cmd.name} ${cmd.usage}`, false);
                            if(cmd.permissions) {
                                let permList: string = '';
                                cmd.permissions.toArray(false).map(p => {
                                    permList += p + '\n';
                                });
                                helpMsg.addField('Permissions:', permList, false);
                            }
                            if(cmd.aliases) {
                                let aList: string = '';
                                cmd.aliases.map(a => {
                                    aList += a + '\n'; 
                                });
                                helpMsg.addField('Aliases:', aList, false);
                            }
                            if(cmd.keywords) {
                                let kwrdList: string = '';
                                cmd.keywords.map(k => {
                                    kwrdList += k + '\n';
                                });
                                helpMsg.addField('Keywords:', kwrdList, false);
                            }
                        }
                        else {
                            throw new ReferenceError(`Command "${a[0]}" does not exist`);
                        }
                    }
                    else {
                        helpMsg.setTitle(params.title);
                        helpMsg.setDescription(params.bottomText);

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
                }
                return helpMsg;
            }
        });
    }
}

export { HelpMessage, HelpMessageParams };