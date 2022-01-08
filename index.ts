import { Bot, BotConfiguration, BotCredentials } from "./src/structures/Bot.js";
import {
    ChatCommandInit,
    ContextMenuCommandInit,
    SubCommandInit,
    SubCommandGroupInit,
    APICommandInit,
    FunctionCommandInit,
    GuildCommandInit,
    PermissionCommandInit,
    PermissionGuildCommandInit,
} from "./src/commands/types/InitOptions.js";
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
} from "./src/structures/Parameter.js";
import { PermissionsError, ParameterTypeError, MissingParameterError, OperationSuccess } from "./src/errors.js";
import {
    ChildCommandType,
    Commands,
    ChildCommands,
    CommandInit,
    ChildCommandInit,
    CommandType,
    CommandFunction,
    ContextType,
    ChildCommandResolvable,
    BaseCommands,
    CommandFunctionReturnTypes,
    BaseCommandType,
    EphemeralType,
} from "./src/commands/types/commands.js";
import { CommandPermissionsInit, PermissionCheckTypes, PermissionFunction } from "./src/commands/types/permissions.js";
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
} from "./src/structures/types/api.js";
import { InputManager } from "./src/structures/InputManager.js";
import { SubCommand } from "./src/commands/SubCommand.js";
import { SubCommandGroup } from "./src/commands/SubCommandGroup.js";
import { ChatCommand } from "./src/commands/ChatCommand.js";
import { ContextMenuCommand } from "./src/commands/ContextMenuCommand.js";
import { FunctionCommand } from "./src/commands/base/FunctionCommand.js";
import { Command } from "./src/commands/base/Command.js";
import { CommandManager } from "./src/structures/CommandManager.js";
import { SystemMessageManager, MessageType, SystemMessageAppearance, SystemMessageData, SystemMessageConfiguration } from "./src/structures/SystemMessage.js";
import { CommandPermissions } from "./src/structures/CommandPermissions.js";
import { HelpMessage, HelpMessageParams } from "./src/commands/Help.js";
import { PrefixManager, ScopeResolvable } from "./src/structures/PrefixManager.js";
import { GuildCommand } from "./src/commands/base/GuildCommand.js";
import { PermissionCommand } from "./src/commands/base/PermissionCommand.js";
import { PermissionGuildCommand } from "./src/commands/base/PermissionGuildCommand.js";
import { BaseObject } from "./src/structures/BaseObject.js";
import { IS_DEVELOPMENT_VERSION, HELP_DEFAULT_CONFIGURATION, SYSTEM_MESSAGES_DEFAULT_CONFIGURATION, API_DEFAULT_INTENTS, CLIENT_DEFAULT_OPTIONS } from "constants.js";

export {
    Bot,
    BotConfiguration,
    BotCredentials,
    ChatCommandInit,
    ContextMenuCommandInit,
    SubCommandGroupInit,
    SubCommandInit,
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
    ChildCommands,
    CommandInit,
    ChildCommandInit,
    SubCommand,
    SubCommandGroup,
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
    ChildCommandResolvable,
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
    APICommandInit,
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
};
