import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { ApiError } from '@/lib/api/client'

export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null

  const isApiError = error instanceof ApiError
  const message = isApiError
    ? error.message
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred'
  const status = isApiError ? error.status : null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="size-4" />
      <AlertTitle>
        {status ? `Error ${status}` : 'Error'}
      </AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
