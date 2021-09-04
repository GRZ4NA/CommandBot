import { MessageEmbed } from "discord.js";
import { Bot } from "./src/structures/Bot.js";
import { TextCommand } from "./src/structures/TextCommand.js";
import { InitOptions } from "./src/types/Bot.js";
import { TextCommandInit, CommandMessageStructure } from "./src/types/TextCommand.js";
import { HelpMessageParams } from "./src/types/HelpMessage.js";
import { ParameterResolvable, ParameterType, ParameterSchema } from "./src/types/Parameter.js";
import { SystemMessageAppearance, SystemMessageData } from "./src/types/SystemMessage.js";
import { ObjectID, InputParameter, StringParameter, BooleanParameter, NumberParameter, ObjectParameter, Parameter } from "./src/structures/Parameter.js";
import { PermissionsError, ParameterTypeError, MissingParameterError, OperationSuccess } from "./src/errors.js";

export default Bot;
export {
    Bot,
    TextCommand,
    MessageEmbed,
    InitOptions,
    TextCommandInit,
    CommandMessageStructure,
    HelpMessageParams,
    ParameterResolvable,
    ParameterType,
    ObjectID,
    SystemMessageAppearance,
    SystemMessageData,
    ParameterSchema,
    Parameter,
    InputParameter,
    StringParameter,
    BooleanParameter,
    NumberParameter,
    ObjectParameter,
    PermissionsError,
    ParameterTypeError,
    MissingParameterError,
    OperationSuccess,
};
