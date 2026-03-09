import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { truncateUuid } from '@/lib/utils'

export function UuidCell({ uuid }: { uuid: string | null | undefined }) {
  const [copied, setCopied] = useState(false)

  if (!uuid) return <span className="text-muted-foreground">—</span>

  const handleCopy = () => {
    navigator.clipboard.writeText(uuid)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {truncateUuid(uuid)}
          {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>{uuid}</TooltipContent>
    </Tooltip>
  )
}
