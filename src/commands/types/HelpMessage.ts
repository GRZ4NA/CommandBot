import { ColorResolvable } from "discord.js";

/**
 * All properties used to customize the appearance of a help message
 * @interface
 */
export interface HelpMessageParams {
    /**
     * Whether help message is enabled
     * @type {boolean}
     */
    enabled: boolean;

    /**
     * Title field
     * @type {string}
     */
    title: string;

    /**
     * Text below the title
     * @type {string}
     */
    bottomText: string;

    /**
     * Color of a message
     * @type {ColorResolvable}
     */
    color: ColorResolvable;

    /**
     * Description of the "help" command
     * @type {string}
     */
    description: string;

    /**
     * Usage of the "help" command
     * @type {string}
     */
    usage: string;

    /**
     * Whether the "help" command should be visible in the help message
     * @type {boolean}
     */
    visible: boolean;
}
