import {defineField, defineType} from 'sanity'
import {EmbedInput} from '../components/EmbedInput'

export const embedType = defineType({
  name: 'embed',
  title: 'Embed',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      description: 'Paste a URL from YouTube, Vimeo, Instagram, TikTok, Twitter/X, Art19, Acast, Buzzsprout, or Amazon Kindle',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'embedId',
      title: 'Embed ID',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional caption for the embed',
    }),
  ],
  components: {
    input: EmbedInput,
  },
  preview: {
    select: {
      url: 'url',
      platform: 'platform',
      caption: 'caption',
    },
    prepare({url, platform, caption}) {
      return {
        title: caption || url || 'Embed',
        subtitle: platform ? `${platform.charAt(0).toUpperCase() + platform.slice(1)} embed` : 'Embed',
      }
    },
  },
})
