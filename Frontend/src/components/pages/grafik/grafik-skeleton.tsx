import { Skeleton } from '#/components/ui/shadcn/skeleton'

export function GrafikCardsSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((cardIdx) => (
        <div
          key={cardIdx}
          className="bg-white dark:bg-neutral-n800 border border-neutral-n40 dark:border-neutral-n700 rounded-xl p-5 shadow-xs space-y-4"
        >
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3.5 w-56" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          {/* Chart Canvas Skeleton */}
          <div className="h-64 sm:h-72 w-full pt-4">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
