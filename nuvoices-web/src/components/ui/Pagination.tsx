import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function generatePageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | "ellipsis")[] = []
  const maxVisible = 7

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    pages.push(1)

    let start = Math.max(2, currentPage - 1)
    let end = Math.min(totalPages - 1, currentPage + 1)

    if (currentPage <= 3) {
      end = Math.min(5, totalPages - 1)
    } else if (currentPage >= totalPages - 2) {
      start = Math.max(2, totalPages - 4)
    }

    if (start > 2) {
      pages.push("ellipsis")
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (end < totalPages - 1) {
      pages.push("ellipsis")
    }

    pages.push(totalPages)
  }

  return pages
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = generatePageNumbers(currentPage, totalPages)

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between px-[1.5rem] py-[0.75rem] border-t border-[#E9EAEB] bg-white font-sans",
        className,
      )}
    >
      {/* Previous button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={cn(
          "bg-[#FFFFFF] border border-solid border-[#d5d7da] rounded-[0.5rem] transition-colors m-0 p-0 flex gap-[0.375rem] items-center justify-center px-[0.75rem] py-[0.5rem] text-[#414651] font-semibold text-[0.75rem] leading-[20px]",
          currentPage === 1
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-[#FFFFFF]",
        )}
        style={{ fontFamily: 'Raleway, sans-serif' }}
        aria-label="Previous page"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <path
            d="M12.5007 6.66671H0.833984M0.833984 6.66671L6.66732 12.5M0.833984 6.66671L6.66732 0.833374"
            stroke="currentColor"
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Previous</span>
      </button>

      {/* Page numbers - Desktop only */}
      <div className="hidden sm:flex items-center gap-[2px]">
        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <div
              key={`ellipsis-${index}`}
              className="flex items-center justify-center w-[40px] h-[40px] rounded-[8px] text-[#535862] text-[0.75rem] font-medium"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              ...
            </div>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "flex items-center justify-center w-[40px] h-[40px] rounded-[8px] text-[0.75rem] font-medium transition-colors border-0 p-0 m-0 cursor-pointer",
                page === currentPage
                  ? "bg-[#FAFAFA] text-[#252b37]"
                  : "bg-transparent text-[#535862] hover:bg-[#FAFAFA]/50",
              )}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {page}
            </button>
          ),
        )}
      </div>

      {/* Page indicator text - Mobile only */}
      <div className="sm:hidden flex items-center justify-center">
        <span className="text-[0.75rem] text-[#414651] font-medium text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
          Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
        </span>
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={cn(
          "bg-[#FFFFFF] border border-solid border-[#d5d7da] rounded-[0.5rem] transition-colors m-0 p-0 flex gap-[0.375rem] items-center justify-center px-[0.75rem] py-[0.5rem] text-[#414651] font-semibold text-[0.75rem] leading-[20px]",
          currentPage === totalPages
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-[#FFFFFF]",
        )}
        style={{ fontFamily: 'Raleway, sans-serif' }}
        aria-label="Next page"
      >
        <span>Next</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <path
            d="M0.833984 6.66671H12.5007M12.5007 6.66671L6.66732 0.833374M12.5007 6.66671L6.66732 12.5"
            stroke="currentColor"
            strokeWidth="1.66667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
