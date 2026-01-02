import {useCallback, useEffect, useState} from 'react'
import {Stack, Text, TextInput, Card, Box, Flex} from '@sanity/ui'
import {set, unset} from 'sanity'
import {ObjectInputProps} from 'sanity'
import {parseEmbedUrl, getPlatformName, type EmbedData} from '../lib/embedHelpers'

export function EmbedInput(props: ObjectInputProps) {
  const {value, onChange, elementProps} = props
  const [embedData, setEmbedData] = useState<EmbedData | null>(null)
  const [urlValue, setUrlValue] = useState<string>((value?.url as string) || '')

  // Parse URL whenever it changes
  useEffect(() => {
    if (urlValue) {
      const data = parseEmbedUrl(urlValue)
      setEmbedData(data)
    } else {
      setEmbedData(null)
    }
  }, [urlValue])

  // Update the document when URL or embedData changes
  useEffect(() => {
    if (embedData && embedData.platform !== 'unknown') {
      onChange([
        set(urlValue, ['url']),
        set(embedData.platform, ['platform']),
        embedData.embedId ? set(embedData.embedId, ['embedId']) : unset(['embedId']),
      ])
    } else if (urlValue) {
      onChange([set(urlValue, ['url']), unset(['platform']), unset(['embedId'])])
    }
  }, [embedData, urlValue, onChange])

  const handleUrlChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = event.currentTarget.value
    setUrlValue(newUrl)
  }, [])

  const renderPreview = () => {
    if (!embedData || !urlValue) {
      return null
    }

    if (embedData.platform === 'unknown') {
      return (
        <Card padding={3} radius={2} shadow={1} tone="critical">
          <Text size={1}>
            ⚠️ Unsupported platform. Supported platforms: YouTube, Vimeo, Instagram, TikTok,
            Twitter/X
          </Text>
        </Card>
      )
    }

    const platformName = getPlatformName(embedData.platform)

    return (
      <Stack space={3}>
        <Card padding={3} radius={2} shadow={1} tone="positive">
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold">
              ✓ {platformName}
            </Text>
            {embedData.embedId && (
              <Text size={1} muted>
                ID: {embedData.embedId}
              </Text>
            )}
          </Flex>
        </Card>

        <Card padding={0} radius={2} shadow={1} overflow="hidden">
          {embedData.platform === 'youtube' && embedData.embedUrl && (
            <Box style={{position: 'relative', paddingBottom: '56.25%', height: 0}}>
              <iframe
                src={embedData.embedUrl}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube video preview"
              />
            </Box>
          )}

          {embedData.platform === 'vimeo' && embedData.embedUrl && (
            <Box style={{position: 'relative', paddingBottom: '56.25%', height: 0}}>
              <iframe
                src={embedData.embedUrl}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Vimeo video preview"
              />
            </Box>
          )}

          {embedData.platform === 'instagram' && embedData.embedId && (
            <Box padding={3}>
              <Text size={1} muted>
                Instagram preview not available in Studio. Post will display on your website.
              </Text>
            </Box>
          )}

          {embedData.platform === 'tiktok' && embedData.embedId && (
            <Box padding={3}>
              <Text size={1} muted>
                TikTok preview not available in Studio. Video will display on your website.
              </Text>
            </Box>
          )}

          {embedData.platform === 'twitter' && embedData.embedId && (
            <Box padding={3}>
              <Text size={1} muted>
                Twitter/X preview not available in Studio. Tweet will display on your website.
              </Text>
            </Box>
          )}
        </Card>
      </Stack>
    )
  }

  return (
    <Stack space={3} {...elementProps}>
      <TextInput
        value={urlValue}
        onChange={handleUrlChange}
        placeholder="https://www.youtube.com/watch?v=..."
      />
      {renderPreview()}
      {props.renderDefault({
        ...props,
        value: value,
        // Only render the caption field, hide url/platform/embedId since we handle them above
        members: props.members.filter((member) => member.name === 'caption'),
      })}
    </Stack>
  )
}
