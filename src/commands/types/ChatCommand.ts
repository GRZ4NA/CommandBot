import { ParameterSchema } from "../../structures/types/Parameter.js";
import { BaseCommandInit } from "./BaseCommand.js";

/**
 * @interface
 * Options for building a {@link Command} object
 */
export interface ChatCommandInit extends BaseCommandInit {
    parameters?: ParameterSchema[] | "simple" | "no_input";
    aliases?: string[] | string;
    description?: string;
    usage?: string;
    visible?: boolean;
    slash?: boolean;
}
