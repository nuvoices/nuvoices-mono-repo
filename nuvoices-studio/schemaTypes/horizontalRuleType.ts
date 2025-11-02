import { defineType } from "sanity";

export const horizontalRuleType = defineType({
  name: "horizontalRule",
  title: "Horizontal Rule",
  type: "object",
  fields: [
    {
      name: "style",
      type: "string",
      hidden: true,
      initialValue: "lineBreak",
    },
  ],
  preview: {
    prepare() {
      return {
        title: "— Horizontal Rule —",
      };
    },
  },
});
