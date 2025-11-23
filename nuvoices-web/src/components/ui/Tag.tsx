import { cn, getTagColor, type TagColor } from "@/lib/utils"

interface TagProps {
  label: string
  color?: TagColor
  className?: string
}

export function Tag({ label, color = "auto", className }: TagProps) {
  const colorClasses = getTagColor(label, color)

  return (
    <span
      className={cn(
        "inline-block px-[0.5rem] py-[0.125rem] rounded-[0.625rem] text-[0.75rem] font-medium border capitalize",
        colorClasses.bg,
        colorClasses.text,
        colorClasses.border,
        className,
      )}
    >
      {label}
    </span>
  )
}

interface TagListProps {
  items: string | null
  separator?: string
  color?: TagColor
  className?: string
}

/**
 * Split a string by separator while ignoring separators inside parentheses
 */
function smartSplit(str: string, separator: string): string[] {
  const result: string[] = []
  let current = ""
  let depth = 0

  for (let i = 0; i < str.length; i++) {
    const char = str[i]

    if (char === "(") {
      depth++
      current += char
    } else if (char === ")") {
      depth--
      current += char
    } else if (char === separator && depth === 0) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }

  if (current) {
    result.push(current)
  }

  return result
}

export function TagList({
  items,
  separator = ",",
  color = "auto",
  className,
}: TagListProps) {
  if (!items) return <span className="text-[#717680]">-</span>

  const tags = smartSplit(items, separator)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  if (tags.length === 0) return <span className="text-[#717680]">-</span>

  return (
    <div className={cn("flex flex-wrap gap-[0.25rem]", className)}>
      {tags.map((tag, index) => (
        <Tag key={`${tag}-${index}`} label={tag} color={color} />
      ))}
    </div>
  )
}
