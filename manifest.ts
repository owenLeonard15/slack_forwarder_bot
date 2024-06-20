import { Manifest } from "deno-slack-sdk/mod.ts";
import MessagePostedWorkflow from "./workflows/message_posted.ts";
import KeywordDatastore from "./datastores/keywords.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "reverse-string-app",
  description: "Post the reversed version of a string to a selected channel",
  icon: "assets/default_new_app_icon.png",
  workflows: [MessagePostedWorkflow],
  datastores: [KeywordDatastore],
  outgoingDomains: [],
  botScopes: [
    "commands", 
    "groups:write",
    "im:write",
    "im:history",
    "mpim:write",
    "chat:write",
    "chat:write.public",
    "triggers:write",
    "triggers:read",
    "datastore:read",
    "datastore:write",
  ],
});
