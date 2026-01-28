/**
 * NotFoundPage (404)
 *
 * Displayed when users navigate to a route that doesn't exist.
 * Features:
 * - Clear 404 messaging
 * - Navigation back to home
 * - Consistent with app theming
 */

import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skull } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="Not Found" />

      <div className="flex-1 flex items-center justify-center">
        <ErrorState
          variant="notFound"
          title="Page not found"
          description="The doomsday event you're looking for doesn't exist... yet."
          icon={<Skull size={32} />}
          showRetry
          retryText="Go back"
          showHomeButton
        />
      </div>
    </div>
  )
}
