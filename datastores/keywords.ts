import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const KeywordDatastore = DefineDatastore({
  name: "keywords",
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.types.string,
    },
    keyword: {
      type: Schema.types.string,
    },
  },
});

export default KeywordDatastore;
