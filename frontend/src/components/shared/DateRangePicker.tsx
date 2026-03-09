import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import type { DateRange } from 'react-day-picker'

interface DateRangePickerProps {
  value: { from: Date; to: Date }
  onChange: (range: { from: Date; to: Date }) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>({
    from: value.from,
    to: value.to,
  })

  const defaultRanges = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ]

  const handleSelect = (r: DateRange | undefined) => {
    setRange(r)
    if (r?.from && r?.to) {
      onChange({ from: r.from, to: r.to })
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarIcon className="size-4" />
          {format(value.from, 'MMM d, yyyy')} — {format(value.to, 'MMM d, yyyy')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex gap-2 p-3 border-b">
          {defaultRanges.map((r) => (
            <Button
              key={r.days}
              variant="outline"
              size="sm"
              onClick={() => {
                const to = new Date()
                const from = subDays(to, r.days)
                setRange({ from, to })
                onChange({ from, to })
                setOpen(false)
              }}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}
