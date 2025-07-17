import { defineField, defineType } from "sanity";

export const expertType = defineType({
  name: "expert",
  title: "Expert",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "languages",
      title: "Languages",
      type: "array",
      of: [{type: "string"}],
    }),
    
  ],
});