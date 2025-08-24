import { defineField, defineType } from "sanity";

export const categoryType = defineType({
  name: "category",
  title: "Category",
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
      rows: 3,
    }),
    defineField({
      name: "parent",
      title: "Parent Category",
      type: "reference",
      to: [{ type: "category" }],
      description: "Select a parent category to create a hierarchy",
    }),
    defineField({
      name: "wpTermId",
      title: "WordPress Term ID",
      type: "number", 
      description: "Original WordPress category ID for migration reference",
      hidden: true,
    }),
    defineField({
      name: "wpNicename",
      title: "WordPress Nicename",
      type: "string",
      description: "Original WordPress category nicename for migration reference", 
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "description",
      parentTitle: "parent.title",
    },
    prepare({ title, subtitle, parentTitle }) {
      return {
        title,
        subtitle: parentTitle ? `${parentTitle} → ${subtitle || ""}` : subtitle,
      };
    },
  },
});