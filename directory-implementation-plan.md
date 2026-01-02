# Directory Page Implementation Plan

## Overview
Update `/nuvoices-web/src/app/directory/page.tsx` to replace the experts page functionality, then delete the entire `/nuvoices-web/src/app/experts` folder.

## Step 1: Get Figma Design Content
- Use Figma MCP to get the selected design
- Extract the static content: title, intro paragraph, and any other text sections
- Note the layout structure and spacing

## Step 2: Update Directory Page Structure
Convert to "use client" and implement the following structure:

### Imports to Add
```typescript
"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "use-debounce"
import { Content } from "@/components/ui/Content"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
```

### TypeScript Interfaces
```typescript
interface Record {
  id: number
  name: string
  country: string
  languages: string | null
  specializations: string | null
}

interface ApiResponse {
  data: Record[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
```

### Data Fetching Function
```typescript
async function fetchRecords(search?: string): Promise<Record[]> {
  const url = new URL(
    "https://nuvoices-worker.storywithoutend.workers.dev/records",
  )
  if (search) {
    url.searchParams.set("search", search)
  }

  const response = await fetch(url.toString())
  const data: ApiResponse = await response.json()
  return data.data
}
```

## Step 3: Component Structure

### State Management
```typescript
const [filterInput, setFilterInput] = useState("")
const [debouncedFilter] = useDebounce(filterInput, 300)

const {
  data: records,
  isLoading,
  isError,
  error,
} = useQuery({
  queryKey: ["records", debouncedFilter],
  queryFn: () => fetchRecords(debouncedFilter),
})
```

### Layout Structure
1. **Static content from Figma** (title, intro text, etc.)
2. **Search input** - positioned directly above table
   - Use consistent gap spacing (check Figma design for spacing between related elements)
   - Same implementation as experts page (lines 69-76)
3. **Table section**:
   - Show skeleton when `isLoading` is true
   - Show error state when `isError` is true
   - Show actual table when loaded successfully

## Step 4: Create Skeleton Table Component

Create a skeleton that matches the table structure:

```typescript
function TableSkeleton() {
  return (
    <div className='w-full border bg-[#FFFAFA] font-sans border border-[#E9EAEB]'>
      <div className='px-[01.5rem] py-[1.25rem] font-semibold text-[1.125rem] bg-gray-200 animate-pulse'>
        <div className="h-6 w-64 bg-gray-300 rounded"></div>
      </div>
      <div className='w-full overflow-x-auto'>
        <Table className='border-t border-[#E9EAEB] border-collapse'>
          <TableHeader className='bg-[#FAFAFA] border-b border-[#E9EAEB]'>
            <TableRow>
              <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Name</TableHead>
              <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Country</TableHead>
              <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Languages</TableHead>
              <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Specializations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(10)].map((_, i) => (
              <TableRow key={i} className='border-b border-red-200'>
                <TableCell className="px-[1.5rem] py-[1rem]">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="px-[1.5rem] py-[1rem]">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="px-[1.5rem] py-[1rem]">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="px-[1.5rem] py-[1rem]">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

## Step 5: Table Implementation

Copy exact table implementation from experts/page.tsx (lines 88-118):
- Container div with border and background
- Title section: "Greater China Female & Non-Binary Experts"
- Table with headers: Name, Country, Languages, Specializations
- Table rows mapping over records
- All styling classes exactly as in experts page

## Step 6: Conditional Rendering Logic

```typescript
{isLoading && <TableSkeleton />}

{isError && (
  <div className='text-center text-red-600'>
    Error: {error instanceof Error ? error.message : "Failed to load records"}
  </div>
)}

{!isLoading && !isError && (
  // Actual table implementation here
)}
```

## Step 7: Remove Elements
- Remove the "ACCESS OUR DIRECTORY HERE" ActionButton and its container div
- Remove any content that doesn't appear in the Figma design
- Keep only: static content from Figma + search input + table

## Step 8: Delete Experts Folder
After verifying the directory page works correctly:
```bash
rm -rf /Users/davidchu/projects/nuvoices/nuvoices-mono-repo/nuvoices-web/src/app/experts
```

## Key Points
- The table should behave EXACTLY as on experts page
- Skeleton appears on initial load AND during search
- Search uses same debounce (300ms)
- Keep all styling classes identical to experts page
- No component extraction - inline everything in directory page
- Static content and layout from Figma design

## Testing Checklist
- [ ] Initial page load shows skeleton
- [ ] Skeleton disappears when data loads
- [ ] Search input triggers skeleton while fetching
- [ ] Table displays all records correctly
- [ ] Error state displays properly
- [ ] Styling matches experts page exactly
- [ ] All static content from Figma is present and styled correctly
