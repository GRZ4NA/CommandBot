import { ParameterTypeError } from "./Error.js";

export type ParameterType = "STRING" | "BOOLEAN" | "INTEGER" | "FLOAT";
export type ParameterResolvable = string | boolean | number;
export interface Parameter {
    name: string;
    optional: boolean;
    type: ParameterType;
}
export const ProcessArgument = (
    a: string,
    type: ParameterType
): ParameterResolvable => {
    switch (type) {
        case "STRING":
            return a;
        case "INTEGER":
            const numI = parseInt(a);
            if (isNaN(numI)) {
                throw new ParameterTypeError(a, type);
            } else {
                return numI;
            }
        case "FLOAT":
            const numF = parseFloat(a);
            if (isNaN(numF)) {
                throw new ParameterTypeError(a, type);
            } else {
                return numF;
            }
        case "BOOLEAN":
            if (a.toLowerCase() == "true") {
                return true;
            } else if (a.toLowerCase() == "false") {
                return false;
            } else {
                throw new ParameterTypeError(a, type);
            }
        default:
            throw new TypeError("Invalied type specified");
    }
};
