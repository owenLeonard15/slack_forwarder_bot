import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import KeywordDatastore from "../datastores/keywords.ts";

/**
 * Functions are reusable building blocks of automation that accept
 * inputs, perform calculations, and provide outputs. Functions can
 * be used independently or as steps in workflows.
 * https://api.slack.com/automation/functions/custom
 */
const SOURCE_CHANNEL = "";
const BOT_CHANNEL = "";
const TARGET_CHANNEL = "";

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
      messageTS: {
        type: Schema.types.string,
        description: "The timestamp of the message",
      },
      sourceChannel: {
        type: Schema.types.string,
        description: "The channel the message originated from",
      },
      sourceUser: {
        type: Schema.types.string,
        description: "The user who posted the message",
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
      channelToPost: {
        type: Schema.types.string,
        description: "The channel to post the message to",
      },
    },
  },
});

export default SlackFunction(
  ForwardFunctionDefinition,
  async ({ inputs, client }) => {
    const inputMessage = inputs.messageToParse;
    const sourceChannel = inputs.sourceChannel;
    const sourceUser = inputs.sourceUser;
    console.log("\n SOURCE: ", sourceChannel);
    console.log("\n USER: ", sourceUser);
    console.log("\n MESSAGE: ", inputMessage)
    let stringToForward = "";
    let channelToPost = TARGET_CHANNEL;
    // if the first word is "add" then add the next word to the datastore
    const firstWord = inputMessage.split(" ")[0];
    
    if (sourceChannel === BOT_CHANNEL) {
      if (firstWord === "add") {
        // const keyword = inputMessage.split(" ")[1];
        // instead of taking the second word, take the entire message after the first word
        const keyword = inputMessage.split(" ").slice(1).join(" ");
        const draftId = crypto.randomUUID();

        const putResp = await client.apps.datastore.put<typeof KeywordDatastore.definition>({
          datastore: KeywordDatastore.name,
          item: {
            id: draftId,
            keyword: keyword,
          },
        });

        if (!putResp.ok) {
          const SaveErrorMsg =
            `Error saving keyword - (Error detail: ${putResp.error})`;
          console.log(SaveErrorMsg);

          return { error: SaveErrorMsg };
        }
        stringToForward = `Added keyword: ${keyword}`;
      } else if (firstWord === "get") {
        // if the first word is "get" then get all the keywords from the datastore
        let cursor = null;
        let allKeywords: string[] = [];
        do {
          const params = {
            datastore: KeywordDatastore.name,
            limit: 1000, // Set the limit to the maximum number of entries to retrieve per request
            ...(cursor && { cursor: cursor }),
          };

          const response = await client.apps.datastore.query(params);
          
          if (!response.ok) {
            const errorMsg = `Error querying datastore - (Error detail: ${response.error})`;
            console.log(errorMsg);
            return { error: errorMsg };
          }
          const filtered = response.items.filter((item) => item.keyword);
          const keywords: string[] = response.items.filter((item) => item.keyword).map((item) => item.keyword);
          allKeywords = allKeywords.concat(keywords);

          cursor = response.cursor;
        } while (cursor);

        stringToForward = `Keywords: ${allKeywords.join(", ")}`;
      } else if (firstWord === "delete") {
        // if the first word is "delete" then delete the rest of the message from the datastore
        const keyword = inputMessage.split(" ").slice(1).join(" ");
        let cursor = null;
        let ids_to_delete: string[] = [];
        do {
          const params = {
            datastore: KeywordDatastore.name,
            limit: 1000, // Set the limit to the maximum number of entries to retrieve per request
            ...(cursor && { cursor: cursor }),
          };

          const response = await client.apps.datastore.query(params);
          
          if (!response.ok) {
            const errorMsg = `Error querying datastore - (Error detail: ${response.error})`;
            console.log(errorMsg);
            return { error: errorMsg };
          }
          const filtered = response.items.filter((item) => item.keyword === keyword);
          console.log("filtered ids: \n", filtered);
          ids_to_delete = filtered.map((item) => item.id);
          console.log("ids to delete: \n", ids_to_delete);
          cursor = response.cursor;
        } while (cursor);

        if (ids_to_delete.length > 0) {
          const deleteResp = await client.apps.datastore.delete({
            datastore: KeywordDatastore.name,
            id: ids_to_delete[0],
          });

          if (!deleteResp.ok) {
            const deleteErrorMsg =
              `Error deleting keyword - (Error detail: ${deleteResp.error})`;
            console.log(deleteErrorMsg);

            return { error: deleteErrorMsg };
          }
          stringToForward = `Deleted keyword: ${keyword}`;
        } else {
          stringToForward = `Keyword: ${keyword} not found`;
        }
      } else if(firstWord === "help"){
        stringToForward = "Commands: \
          \n add `keyword` - adds `keyword` to the datastore \
          \n get - get all keywords from the datastore \
          \n delete `keyword` - deletes `keyword` from the datastore \
          \n help - get help";
      }

      channelToPost = BOT_CHANNEL;
    }
    else if (sourceChannel === SOURCE_CHANNEL){
      // check if the message contains any keywords and forward the entire message if it does
      const words: string[] = inputMessage.split(" ");
      let cursor = null;
      let allKeywords: string[] = [];
      do {
        const params = {
          datastore: KeywordDatastore.name,
          limit: 1000, // Set the limit to the maximum number of entries to retrieve per request
          ...(cursor && { cursor: cursor }),
        };

        const response = await client.apps.datastore.query(params);
        
        if (!response.ok) {
          const errorMsg = `Error querying datastore - (Error detail: ${response.error})`;
          console.log(errorMsg);
          return { error: errorMsg };
        }
        const keywords: string[] = response.items.filter((item) => item.keyword).map((item) => item.keyword);
        allKeywords = allKeywords.concat(keywords);

        cursor = response.cursor;
      } while (cursor);

      console.log("all keywords: \n", allKeywords);

      const containsKeyword = words.some((word: string) => allKeywords.includes(word));
      if(containsKeyword){
        channelToPost = TARGET_CHANNEL; // forward to a different channel
        stringToForward = inputMessage;
      } else {
        console.log("No keywords found in message");
        stringToForward = "";
        channelToPost = BOT_CHANNEL;
      }

    } else {
      stringToForward = "Invalid channel";
      channelToPost = BOT_CHANNEL;
    }
    // if there is no string to forward, return an error
    if (!stringToForward) {
      return { outputs: "No string to forward" };
    } else {
      // retrieve full message using slack api 

    }
    return {
      outputs: { stringToForward, channelToPost },
    };
  },
);
