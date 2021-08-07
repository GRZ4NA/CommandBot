import { ParameterType, ParameterResolvable, Choice } from "./types.js";
export interface Parameter {
    name: string;
    description?: string;
    optional: boolean;
    type: ParameterType;
    choices?: Choice[];
}
export const ProcessArgument = (
    a: string,
    type: ParameterType
): ParameterResolvable => {
    switch (type) {
        /* case "TEXT":
            return a;
        case "NUMBER":
            const numF = parseFloat(a);
            if (isNaN(numF)) {
                throw new ParameterTypeError(a, type);
            } else {
                return numF;
            }
        case "TRUE/FALSE":
            if (a.toLowerCase() == "true") {
                return true;
            } else if (a.toLowerCase() == "false") {
                return false;
            } else {
                throw new ParameterTypeError(a, type);
            }*/
        default:
            return a;
        //throw new TypeError("Invalied type specified");
    }
};
