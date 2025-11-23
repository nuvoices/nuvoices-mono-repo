import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type TagColor = "gray" | "yellow" | "green" | "pink" | "cyan" | "amber" | "lime" | "emerald" | "teal" | "blue" | "purple" | "rose" | "auto"

const TAG_COLORS = {
  gray: {
    bg: "bg-[#E8E4E1]",
    text: "text-[#5A5350]",
    border: "border-[#C9C3BF]",
  },
  yellow: {
    bg: "bg-[#FFF8E8]",
    text: "text-[#8B6914]",
    border: "border-[#F0DDB3]",
  },
  amber: {
    bg: "bg-[#FFE8CC]",
    text: "text-[#9D5A1F]",
    border: "border-[#E5C78F]",
  },
  lime: {
    bg: "bg-[#F0F4E4]",
    text: "text-[#5A6B3E]",
    border: "border-[#D4DFBC]",
  },
  green: {
    bg: "bg-[#E4F4E8]",
    text: "text-[#3A5F42]",
    border: "border-[#BDD9C5]",
  },
  emerald: {
    bg: "bg-[#E0F3EE]",
    text: "text-[#2D5F56]",
    border: "border-[#B8DDD2]",
  },
  teal: {
    bg: "bg-[#E0F5F5]",
    text: "text-[#2D5F5F]",
    border: "border-[#B8DDDD]",
  },
  cyan: {
    bg: "bg-[#E8F5F9]",
    text: "text-[#3A5A6B]",
    border: "border-[#BFD9E4]",
  },
  blue: {
    bg: "bg-[#E8EFFA]",
    text: "text-[#3A4A6B]",
    border: "border-[#BFD0EA]",
  },
  purple: {
    bg: "bg-[#F0ECF9]",
    text: "text-[#5A4A6B]",
    border: "border-[#D4CBE4]",
  },
  pink: {
    bg: "bg-[#F9ECF5]",
    text: "text-[#6B3A5A]",
    border: "border-[#E4C0D9]",
  },
  rose: {
    bg: "bg-[#F9E8E8]",
    text: "text-[#6B3A3A]",
    border: "border-[#E4BFBF]",
  },
} as const

/**
 * DJB2 hash algorithm - simple and efficient string hashing
 */
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i)
  }
  return Math.abs(hash)
}

/**
 * Get tag color classes based on content hash or explicit color
 */
export function getTagColor(content: string, color: TagColor = "auto") {
  if (color !== "auto") {
    return TAG_COLORS[color]
  }

  const colorKeys = Object.keys(TAG_COLORS).filter((k) => k !== "gray") as Array<
    keyof typeof TAG_COLORS
  >
  const hash = hashString(content)
  const colorIndex = hash % colorKeys.length
  const colorKey = colorKeys[colorIndex]

  return TAG_COLORS[colorKey]
}
