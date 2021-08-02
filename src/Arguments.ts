import { ArgumentTypeError } from "./Error.js";

export type ArgumentType = "STRING" | "BOOLEAN" | "INTEGER" | "FLOAT";
export type ArgumentResolvable = string | boolean | number;
export interface Argument {
    name: string;
    optional: boolean;
    type: ArgumentType;
}
export const ProcessArgument = (
    a: string,
    type: ArgumentType
): ArgumentResolvable => {
    switch (type) {
        case "STRING":
            return a;
        case "INTEGER":
            const numI = parseInt(a);
            if (isNaN(numI)) {
                throw new ArgumentTypeError(a, type);
            } else {
                return numI;
            }
        case "FLOAT":
            const numF = parseFloat(a);
            if (isNaN(numF)) {
                throw new ArgumentTypeError(a, type);
            } else {
                return numF;
            }
        case "BOOLEAN":
            if (a.toLowerCase() == "true") {
                return true;
            } else if (a.toLowerCase() == "false") {
                return false;
            } else {
                throw new ArgumentTypeError(a, type);
            }
        default:
            throw new TypeError("Invalied type specified");
    }
};
