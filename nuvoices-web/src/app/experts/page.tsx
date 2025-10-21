'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from 'use-debounce'

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
  const url = new URL('https://nuvoices-worker.storywithoutend.workers.dev/records')
  if (search) {
    url.searchParams.set('search', search)
  }

  const response = await fetch(url.toString())
  console.log('response', response)
  const data: ApiResponse = await response.json()
  return data.data
}

export default function ExpertsPage() {
  const [filterInput, setFilterInput] = useState('')
  const [debouncedFilter] = useDebounce(filterInput, 300)

  const { data: records, isLoading, isError, error } = useQuery({
    queryKey: ['records', debouncedFilter],
    queryFn: () => fetchRecords(debouncedFilter),
  })

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-serif text-center mb-16">Experts</h1>
        <div className="flex justify-center mb-8">
          <input
            type="text"
            placeholder="Search experts by name, country, languages, or specializations..."
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            className="w-full max-w-2xl px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isLoading && (
          <div className="text-center">Loading...</div>
        )}

        {isError && (
          <div className="text-center text-red-600">
            Error: {error instanceof Error ? error.message : 'Failed to load records'}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="flex justify-center">
            <table className="border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Country</th>
                  <th className="text-left p-4">Languages</th>
                  <th className="text-left p-4">Specializations</th>
                </tr>
              </thead>
              <tbody>
                {records?.map((record) => (
                  <tr key={record.id} className="border-b">
                    <td className="p-4">{record.name}</td>
                    <td className="p-4">{record.country}</td>
                    <td className="p-4">{record.languages || '-'}</td>
                    <td className="p-4">{record.specializations || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
