import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ForwardFunctionDefinition } from "../functions/forward.ts";

/**
 * A workflow is a set of steps that are executed in order.
 * Each step in a workflow is a function.
 * https://api.slack.com/automation/workflows
 */
const MessagePostedWorkflow = DefineWorkflow({
  callback_id: "message_posted",
  title: "Test Message Posted Function",
  description: "test the reverse function",
  input_parameters: {
    properties: {
      message_ts: {
        type: Schema.slack.types.message_ts,
      },
      channel_id: {
        type: Schema.slack.types.channel_id,
      },
      text: {
        type: Schema.types.string,
      },
      user_id: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["text"],
  },
});


const forwardStep = MessagePostedWorkflow.addStep(ForwardFunctionDefinition, {
  messageToParse: MessagePostedWorkflow.inputs.text,
  messageTS: MessagePostedWorkflow.inputs.message_ts,
  sourceChannel: MessagePostedWorkflow.inputs.channel_id,
  sourceUser: MessagePostedWorkflow.inputs.user_id,
});


const sendMessage = MessagePostedWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: forwardStep.outputs.channelToPost,
  message: forwardStep.outputs.stringToForward,
});


export default MessagePostedWorkflow;
