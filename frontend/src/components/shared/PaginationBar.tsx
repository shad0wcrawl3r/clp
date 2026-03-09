import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationBarProps {
  offset: number
  limit: number
  count: number
  onOffsetChange: (offset: number) => void
}

export function PaginationBar({ offset, limit, count, onOffsetChange }: PaginationBarProps) {
  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(count / limit)

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages || 1}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={offset === 0}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
        >
          <ChevronLeft className="size-4" />
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={offset + limit >= count}
          onClick={() => onOffsetChange(offset + limit)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
