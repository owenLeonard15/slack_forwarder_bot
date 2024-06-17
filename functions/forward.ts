import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

/**
 * Functions are reusable building blocks of automation that accept
 * inputs, perform calculations, and provide outputs. Functions can
 * be used independently or as steps in workflows.
 * https://api.slack.com/automation/functions/custom
 */
export const ForwardFunctionDefinition = DefineFunction({
  callback_id: "forward",
  title: "Forward",
  description: "Takes a string, parses it, and forwards the parsed string",
  source_file: "functions/forward.ts",
  input_parameters: {
    properties: {
      messageToParse: {
        type: Schema.types.string,
        description: "The string to parse and forward",
      },
    },
    required: ["messageToParse"],
  },
  output_parameters: {
    properties: {
      stringToForward: {
        type: Schema.types.string,
        description: "The string in the message to forward",
      },
    },
    required: ["stringToForward"],
  },
});

export default SlackFunction(
  ForwardFunctionDefinition,
  ({ inputs }) => {
    const stringToForward = inputs.messageToParse;
    // do custom parsing logic here
    return {
      outputs: { stringToForward },
    };
  },
);
