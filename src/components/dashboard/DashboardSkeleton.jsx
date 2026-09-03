const Block = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded-xl ${className}`}
    style={{ background: 'var(--surface-hover)' }}
  />
)

/** Mirrors the real dashboard layout so nothing jumps when data lands. */
const DashboardSkeleton = () => (
  <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8" aria-busy="true">
    <Block className="mb-6 h-8 w-56" />

    <div className="space-y-4">
      <div className="panel p-5">
        <Block className="h-3 w-32" />
        <Block className="mt-3 h-11 w-52" />
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Block className="h-16" />
          <Block className="h-16" />
          <Block className="h-16" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Block className="h-[74px]" />
        <Block className="h-[74px]" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Block className="h-[104px]" />
        <Block className="h-[104px]" />
        <Block className="h-[104px]" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Block className="h-72 lg:col-span-3" />
        <Block className="h-72 lg:col-span-2" />
      </div>
    </div>
  </div>
)

export default DashboardSkeleton
