/**
 * Placeholder blocks. Uses a CSS pulse rather than a per-element animation
 * driver, so a page full of skeletons stays cheap.
 */
const VARIANTS = {
  default: 'rounded-xl bg-[color:var(--surface-hover)]',
  text: 'h-4 rounded bg-[color:var(--surface-hover)]',
  avatar: 'rounded-full bg-[color:var(--surface-hover)]',
  card: 'rounded-2xl border border-[color:var(--line-subtle)] bg-[color:var(--surface-raised)]',
  button: 'h-10 rounded-xl bg-[color:var(--surface-hover)]'
}

const Skeleton = ({ className = '', variant = 'default', children }) => (
  <div
    aria-hidden="true"
    className={[
      VARIANTS[variant] ?? VARIANTS.default,
      children ? '' : 'animate-pulse',
      className
    ].filter(Boolean).join(' ')}
  >
    {children}
  </div>
)

export const CardSkeleton = () => (
  <Skeleton variant="card" className="space-y-4 p-5">
    <div className="flex items-center gap-3">
      <Skeleton variant="avatar" className="h-10 w-10" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-1/4" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
  </Skeleton>
)

export const TableSkeleton = ({ rows = 5 }) => (
  <Skeleton variant="card" className="overflow-hidden">
    <div
      className="border-b p-4"
      style={{ borderColor: 'var(--line-subtle)', background: 'var(--surface-overlay)' }}
    >
      <div className="flex gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="text" className="w-20" />
        ))}
      </div>
    </div>

    <div className="space-y-4 p-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-6">
          {Array.from({ length: 4 }).map((_, cellIndex) => (
            <Skeleton key={cellIndex} variant="text" className="w-20" />
          ))}
        </div>
      ))}
    </div>
  </Skeleton>
)

export const StatsSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} variant="card" className="space-y-3 p-4">
        <Skeleton variant="avatar" className="h-8 w-8" />
        <Skeleton variant="text" className="h-6 w-16" />
        <Skeleton variant="text" className="w-12" />
      </Skeleton>
    ))}
  </div>
)

export const TimelineSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-start gap-3">
        <Skeleton variant="avatar" className="mt-0.5 h-8 w-8" />
        <Skeleton variant="card" className="flex-1 space-y-2 p-4">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </Skeleton>
      </div>
    ))}
  </div>
)

export const PageHeaderSkeleton = () => (
  <div className="mb-5 space-y-5">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton variant="text" className="h-6 w-40" />
        <Skeleton variant="text" className="w-64" />
      </div>
      <Skeleton variant="button" className="w-32" />
    </div>
  </div>
)

const SkeletonLoader = Skeleton
SkeletonLoader.CardSkeleton = CardSkeleton
SkeletonLoader.TableSkeleton = TableSkeleton
SkeletonLoader.StatsSkeleton = StatsSkeleton
SkeletonLoader.TimelineSkeleton = TimelineSkeleton
SkeletonLoader.PageHeaderSkeleton = PageHeaderSkeleton

export default SkeletonLoader
