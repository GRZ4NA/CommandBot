import { Bot } from "./src/structures/Bot.js";
import { InitOptions } from "./src/structures/types/Bot.js";
import { ChatCommandInit, ContextMenuCommandInit, NestedCommandInit, SubCommandInit, SubCommandGroupInit } from "./src/commands/types/InitOptions.js";
import { HelpMessageParams } from "./src/commands/types/HelpMessage.js";
import { ParameterResolvable, ParameterType, ParameterSchema } from "./src/structures/types/Parameter.js";
import { SystemMessageAppearance, SystemMessageData } from "./src/structures/types/SystemMessage.js";
import { ObjectID, TargetID, Parameter } from "./src/structures/parameter.js";
import { PermissionsError, ParameterTypeError, MissingParameterError, OperationSuccess } from "./src/errors.js";
import { CommandInteractionData, CommandType, ChildCommandType, Command, ChildCommand, CommandInit, ChildCommandInit } from "./src/commands/types/commands.js";
import { CommandPermissionsInit } from "./src/commands/types/permissions.js";

export default Bot;
export {
    Bot,
    InitOptions,
    ChatCommandInit,
    ContextMenuCommandInit,
    NestedCommandInit,
    SubCommandGroupInit,
    SubCommandInit,
    CommandPermissionsInit,
    CommandInteractionData,
    HelpMessageParams,
    ParameterResolvable,
    ParameterType,
    ObjectID,
    TargetID,
    SystemMessageAppearance,
    SystemMessageData,
    ParameterSchema,
    Parameter,
    PermissionsError,
    ParameterTypeError,
    MissingParameterError,
    OperationSuccess,
    CommandType,
    ChildCommandType,
    Command,
    ChildCommand,
    CommandInit,
    ChildCommandInit,
};
