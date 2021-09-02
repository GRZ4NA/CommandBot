import { MessageEmbed } from "discord.js";
import { Bot } from "./src/Bot.js";
import { Command } from "./src/Command.js";
import { InitOptions } from "./src/types/Bot.js";
import { CommandBuilder, CommandMessageStructure } from "./src/types/Command.js";
import { HelpMessageParams } from "./src/types/HelpMessage.js";
import { ParameterResolvable, ParameterType, ParameterSchema } from "./src/types/Parameter.js";
import { SystemMessageAppearance, SystemMessageData } from "./src/types/SystemMessage.js";
import { ObjectID, InputParameter, StringParameter, BooleanParameter, NumberParameter, ObjectParameter, Parameter } from "./src/Parameter.js";
import { PermissionsError, ParameterTypeError, MissingParameterError, OperationSuccess } from "./src/errors.js";

export default Bot;
export {
    Bot,
    Command,
    MessageEmbed,
    InitOptions,
    CommandBuilder,
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
