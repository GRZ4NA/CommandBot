import { Bot } from "./src/Bot.js";
import { Command } from "./src/Command.js";
import { InitOptions, CommandBuilder, CommandMessageStructure, HelpMessageParams, ParameterResolvable, ParameterType } from "./src/types.js";
import { ObjectID, InputParameter, ParameterSchema, StringParameter, BooleanParameter, NumberParameter, ObjectParameter, Parameter } from "./src/Parameter.js";
import { SystemMessageAppearance, SystemMessageData } from "./src/SystemMessage.js";
import { PermissionsError, ParameterTypeError, MissingParameterError, OperationSuccess } from "./src/errors.js";
import { MessageEmbed } from "discord.js";

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
