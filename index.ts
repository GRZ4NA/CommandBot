import { Bot, BotConfiguration, BotCredentials } from "./src/structures/Bot";
import {
    ObjectID,
    TargetID,
    Parameter,
    InputParameter,
    ParameterResolvable,
    ParameterType,
    ParameterSchema,
    ObjectIdType,
    TargetType,
    InputParameterValue,
    ObjectIdReturnType,
    TargetIdReturnType,
} from "./src/structures/Parameter";
import { PermissionsError, ParameterTypeError, MissingParameterError, OperationSuccess } from "./src/errors";
import {
    ChildCommandType,
    Commands,
    CommandInitializer,
    CommandType,
    CommandFunction,
    ContextType,
    BaseCommands,
    CommandFunctionReturnTypes,
    BaseCommandType,
    EphemeralType,
} from "./src/commands/types/commands";
import { CommandPermissionsInit, PermissionCheckTypes, PermissionFunction } from "./src/commands/types/permissions";
import {
    APICommandObject,
    APICommandType,
    ChatCommandObject,
    ChatCommandOptionObject,
    ChatCommandOptionType,
    CommandPermission,
    CommandPermissionType,
    ContextMenuCommandObject,
    RegisteredCommandObject,
    SubCommandGroupObject,
    TextCommandOptionChoiceObject,
} from "./src/structures/types/api";
import { InputManager } from "./src/structures/InputManager";
import { ChatCommand, ChatCommandInit } from "./src/commands/ChatCommand";
import { ContextMenuCommand, ContextMenuCommandInit } from "./src/commands/ContextMenuCommand";
import { FunctionCommand, FunctionCommandInit } from "./src/commands/base/FunctionCommand";
import { Command, CommandInit } from "./src/commands/base/Command";
import { CommandManager } from "./src/structures/CommandManager";
import { SystemMessageManager, MessageType, SystemMessageAppearance, SystemMessageData, SystemMessageConfiguration } from "./src/structures/SystemMessage";
import { CommandPermissions } from "./src/structures/CommandPermissions";
import { HelpMessage, HelpMessageParams } from "./src/commands/Help";
import { PrefixManager, ScopeResolvable } from "./src/structures/PrefixManager";
import { GuildCommand, GuildCommandInit } from "./src/commands/base/GuildCommand";
import { PermissionCommand, PermissionCommandInit } from "./src/commands/base/PermissionCommand";
import { PermissionGuildCommand, PermissionGuildCommandInit } from "./src/commands/base/PermissionGuildCommand";
import { BaseObject } from "./src/structures/BaseObject";
import {
    IS_DEVELOPMENT_VERSION,
    HELP_DEFAULT_CONFIGURATION,
    SYSTEM_MESSAGES_DEFAULT_CONFIGURATION,
    API_DEFAULT_INTENTS,
    CLIENT_DEFAULT_OPTIONS,
    DEFAULT_BLANK_DESCRIPTION,
} from "./src/constants.js";

export {
    Bot,
    BotConfiguration,
    BotCredentials,
    ChatCommandInit,
    ContextMenuCommandInit,
    CommandPermissionsInit,
    InputManager,
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
    APICommandType,
    CommandType,
    ChildCommandType,
    Commands,
    CommandInitializer,
    ChatCommand,
    ContextMenuCommand,
    ObjectIdType,
    InputParameter,
    FunctionCommand,
    Command,
    TargetType,
    CommandManager,
    CommandFunction,
    PermissionCheckTypes,
    PermissionFunction,
    ContextType,
    InputParameterValue,
    ObjectIdReturnType,
    TargetIdReturnType,
    SystemMessageManager,
    CommandPermissions,
    RegisteredCommandObject,
    HelpMessage,
    PrefixManager,
    BaseCommands,
    ChatCommandObject,
    APICommandObject,
    ContextMenuCommandObject,
    SubCommandGroupObject,
    CommandFunctionReturnTypes,
    BaseCommandType,
    CommandInit,
    CommandPermission,
    FunctionCommandInit,
    MessageType,
    GuildCommand,
    PermissionCommand,
    PermissionGuildCommand,
    ChatCommandOptionObject,
    CommandPermissionType,
    ScopeResolvable,
    TextCommandOptionChoiceObject,
    ChatCommandOptionType,
    GuildCommandInit,
    PermissionCommandInit,
    PermissionGuildCommandInit,
    EphemeralType,
    BaseObject,
    SystemMessageConfiguration,
    IS_DEVELOPMENT_VERSION,
    HELP_DEFAULT_CONFIGURATION,
    SYSTEM_MESSAGES_DEFAULT_CONFIGURATION,
    API_DEFAULT_INTENTS,
    CLIENT_DEFAULT_OPTIONS,
    DEFAULT_BLANK_DESCRIPTION,
};
