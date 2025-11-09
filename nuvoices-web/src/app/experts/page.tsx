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

export default function ExpertsPage() {
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
    <Content>
      <div className='max-w-6xl mx-auto px-6 py-16'>
        <h1 className='text-5xl font-serif text-center mb-16'>Experts</h1>
        <div className='flex justify-center mb-8'>
          <Input
            type='text'
            placeholder='Search'
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            // className="w-full max-w-2xl px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="h-[24px]"/>
        {isLoading && <div className='text-center'>Loading...</div>}

        {isError && (
          <div className='text-center text-red-600'>
            Error:{" "}
            {error instanceof Error ? error.message : "Failed to load records"}
          </div>
        )}

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
                    <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Country</TableHead>
                    <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Languages</TableHead>
                    <TableHead className="px-[1.5rem] py-[0.75rem] font-semibold text-[0.75rem] text-[#717680]">Specializations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records?.map((record) => (
                    <TableRow
                      key={record.id}
                      className='border-b border-red-200'
                      onClick={() => alert('hellow')}
                    >
                      <TableCell className="px-[1.5rem] py-[1rem] font-semibold text-[0.75rem] text-[#181D27]">{record.name}</TableCell>
                      <TableCell className="px-[1.5rem] py-[1rem] font-semibold text-[0.75rem] text-[#181D27]">{record.country}</TableCell>
                      <TableCell className="px-[1.5rem] py-[1rem] font-semibold text-[0.75rem] text-[#181D27]">{record.languages || "-"}</TableCell>
                      <TableCell className="px-[1.5rem] py-[1rem] font-semibold text-[0.75rem] text-[#181D27]">{record.specializations || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </Content>
  )
}
