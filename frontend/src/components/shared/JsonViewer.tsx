interface JsonViewerProps {
  data: Record<string, unknown> | null | undefined
  className?: string
}

export function JsonViewer({ data, className }: JsonViewerProps) {
  if (!data) return <span className="text-muted-foreground text-xs">null</span>

  return (
    <pre className={`text-xs bg-muted rounded p-2 overflow-auto max-h-48 ${className ?? ''}`}>
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}
