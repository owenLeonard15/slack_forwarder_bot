import { Trigger } from "deno-slack-api/types.ts";
import { TriggerEventTypes, TriggerTypes, TriggerContextData } from "deno-slack-api/mod.ts";
import MessagePostedWorkflow from "../workflows/message_posted.ts";

// Update Channel Id on new installs
const SOURCE_CHANNEL = "C07853U2E94";
const BOT_CHANNEL = "C079K9ARN67";

const trigger: Trigger<typeof MessagePostedWorkflow.definition> = {
  type: TriggerTypes.Event,
  event: {
    event_type: TriggerEventTypes.MessagePosted,
    channel_ids: [BOT_CHANNEL, SOURCE_CHANNEL],
    filter: {
      root: {
        operator: "AND",
        inputs: [{
          operator: "NOT",
          inputs: [{
            // Filter out posts by apps
            statement: "{{data.user_id}} == null",
          }],
        }, {
          // Filter out thread replies
          statement: "{{data.thread_ts}} == null",
        }],
      },
      version: 1,
    },
  },
  name: "Forward the posted message",
  workflow: `#/workflows/${MessagePostedWorkflow.definition.callback_id}`,
  inputs: {
    message_ts: {
      value: TriggerContextData.Event.MessagePosted.message_ts,
    },
    channel_id: {
      value: TriggerContextData.Event.MessagePosted.channel_id,
    },
    text: {
      value: TriggerContextData.Event.MessagePosted.text,
    }, 
    user_id: {
      value: TriggerContextData.Event.MessagePosted.user_id,
    }
  },
};

export default trigger;
