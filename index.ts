import { Bot } from "./src/structures/Bot.js";
import { ChatCommand } from "./src/commands/ChatCommand.js";
import { MessageCommand } from "./src/commands/MessageCommand.js";
import { UserCommand } from "./src/commands/UserCommand.js";
import { InitOptions } from "./src/structures/types/Bot.js";
import { ChatCommandInit } from "./src/commands/types/ChatCommand.js";
import { HelpMessageParams } from "./src/commands/types/HelpMessage.js";
import { ParameterResolvable, ParameterType, ParameterSchema } from "./src/structures/types/Parameter.js";
import { SystemMessageAppearance, SystemMessageData } from "./src/structures/types/SystemMessage.js";
import { ObjectID, Parameter } from "./src/structures/parameter.js";
import { PermissionsError, ParameterTypeError, MissingParameterError, OperationSuccess } from "./src/errors.js";
import { CommandInteractionData } from "./src/commands/types/commands.js";

export default Bot;
export {
    Bot,
    ChatCommand,
    MessageCommand,
    UserCommand,
    InitOptions,
    ChatCommandInit,
    CommandInteractionData,
    HelpMessageParams,
    ParameterResolvable,
    ParameterType,
    ObjectID,
    SystemMessageAppearance,
    SystemMessageData,
    ParameterSchema,
    Parameter,
    PermissionsError,
    ParameterTypeError,
    MissingParameterError,
    OperationSuccess,
};
