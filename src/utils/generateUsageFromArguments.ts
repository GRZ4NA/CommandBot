import { ChatCommand } from "../commands/ChatCommand.js";
import { SubCommand } from "../commands/SubCommand.js";

export function generateUsageFromArguments(cmd: ChatCommand | SubCommand): string {
    let usageTemplate: string = "";
    cmd.parameters &&
        cmd.parameters.map((e) => {
            usageTemplate += `[${e.name} (${e.choices ? e.choices.join(" / ") : e.type}${e.optional ? ", optional" : ""})] `;
        });
    return usageTemplate;
}
