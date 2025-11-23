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

interface Record {
  airtable_id: string
  name: string
  title: string | null
  specialisations: string | null
  category: string | null
  location: string | null
  languages: string | null
  email: string | null
  website: string | null
  twitter: string | null
  linkedin: string | null
  instagram: string | null
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

function TableSkeleton() {
  return (
    <div className='w-full border bg-[#F5F5F5] font-sans border border-[#E9EAEB] opacity-60'>
      <div className='px-[01.5rem] py-[1.25rem] font-semibold text-[1.125rem]'>
        Greater China Female & Non-Binary Experts
      </div>
      <div className='w-full overflow-x-auto'>
        <Table className='border-t border-[#E9EAEB] border-collapse'>
          <TableHeader className='bg-[#E5E5E5] border-b border-[#E9EAEB]'>
            <TableRow>
              <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Name</TableHead>
              <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Title</TableHead>
              <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Specialisations</TableHead>
              <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(10)].map((_, i) => (
              <TableRow key={i} className='border-b border-gray-300'>
                <TableCell className="px-[1.5rem] py-[1rem]">
                  <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="px-[1.5rem] py-[1rem]">
                  <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="px-[1.5rem] py-[1rem]">
                  <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="px-[1.5rem] py-[1rem]">
                  <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default function DirectoryPage() {
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

  return (
    <div className="min-h-screen bg-[#f4ecea]">
      <Content>
        <main className="py-[1.5rem]">
          {/* Title */}
          <h1 className="text-[2.96875rem] font-serif font-normal leading-[1.1] tracking-[-0.089rem] text-[#3c2e24] mb-[1.5rem]">
            Expert Directory
          </h1>

          {/* Intro paragraph */}
          <p className="text-[0.9375rem] leading-[1.6] text-black font-serif mb-[2rem]">
            Our directory of international experts on China is a popular tool for journalists and event organizers.
          </p>

          {/* Second paragraph */}
          <p className="text-[0.9375rem] leading-[1.6] text-black font-serif mb-[2.5rem]">
            Featuring nearly 700 female, non-binary and BIPOC experts on China, our directory has significantly boosted
            the representation of women and minorities in media and events, as reported in{" "}
            <a href="#" className="text-[#3c2e24] underline hover:text-amber-700">Foreign Policy</a> and{" "}
            <a href="#" className="text-[#3c2e24] underline hover:text-amber-700">Globe and Mail</a>.
          </p>

          {/* Search input */}
          <div className='flex justify-center mb-8'>
            <Input
              type='text'
              placeholder='Search'
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
            />
          </div>

          <div className="h-[24px]"/>

          {/* Loading state */}
          {isLoading && <TableSkeleton />}

          {/* Error state */}
          {isError && (
            <div className='text-center text-red-600'>
              Error: {error instanceof Error ? error.message : "Failed to load records"}
            </div>
          )}

          {/* Table */}
          {!isLoading && !isError && (
            <div className='w-full border bg-[#FFFAFA] font-sans border border-[#E9EAEB]'>
              <div className='px-[01.5rem] py-[1.25rem] font-semibold text-[1.125rem]'>
                Greater China Female & Non-Binary Experts
              </div>
              <div className='w-full overflow-x-auto'>
                <Table className='border-t border-[#E9EAEB] border-collapse'>
                  <TableHeader className='bg-[#FAFAFA] border-b border-[#E9EAEB]'>
                    <TableRow>
                      <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Name</TableHead>
                      <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Title</TableHead>
                      <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Specialisations</TableHead>
                      <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records && records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="px-[1.5rem] py-[2rem] text-center text-[#717680] font-serif italic">
                          No matches found
                        </TableCell>
                      </TableRow>
                    ) : (
                      records?.map((record) => (
                        <TableRow
                          key={record.airtable_id}
                          className='border-b border-red-200'
                        >
                          <TableCell className="px-[1.5rem] py-[1rem] font-semibold text-[0.75rem] text-[#181D27]">{record.name}</TableCell>
                          <TableCell className="px-[1.5rem] py-[1rem] font-semibold text-[0.75rem] text-[#181D27]">{record.title || "-"}</TableCell>
                          <TableCell className="px-[1.5rem] py-[1rem] font-semibold text-[0.75rem] text-[#181D27]">{record.specialisations || "-"}</TableCell>
                          <TableCell className="px-[1.5rem] py-[1rem] font-semibold text-[0.75rem] text-[#181D27]">{record.category || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </main>
      </Content>
    </div>
  )
}
