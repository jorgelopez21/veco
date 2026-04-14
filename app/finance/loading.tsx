export default function FinanceLoading() {
  return (
    <div className="flex flex-col min-h-screen p-4 gap-4 bg-background animate-pulse">
      {/* Header Skeleton */}
      <header className="flex justify-between items-center py-2">
        <div className="flex flex-col gap-2">
          <div className="h-2 w-16 bg-muted rounded" />
          <div className="h-10 w-40 bg-muted rounded-xl" />
        </div>
        <div className="w-12 h-12 rounded-full bg-muted" />
      </header>

      {/* Filter Skeleton */}
      <div className="h-10 w-full bg-muted rounded-2xl" />

      {/* Chart Skeleton */}
      <section className="flex flex-col gap-3">
        <div className="h-2 w-24 bg-muted rounded" />
        <div className="h-60 w-full bg-muted rounded-3xl" />
      </section>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-muted rounded-2xl" />
        <div className="h-20 bg-muted rounded-3xl" />
      </div>

      {/* List Skeleton */}
      <section className="flex flex-col gap-4">
        <div className="h-2 w-20 bg-muted rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full bg-muted rounded-2xl" />
        ))}
      </section>
    </div>
  );
}
