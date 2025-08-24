import { defineField, defineType } from "sanity";

export const tagType = defineType({
  name: "tag",
  title: "Tag",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description", 
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "wpNicename",
      title: "WordPress Nicename",
      type: "string",
      description: "Original WordPress tag nicename for migration reference",
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "description",
    },
  },
});