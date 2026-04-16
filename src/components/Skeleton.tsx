function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-cream ${className}`} />;
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <Bone className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4 space-y-2.5">
        <Bone className="h-3.5 w-4/5" />
        <Bone className="h-3.5 w-3/5" />
        <div className="flex items-center justify-between mt-3">
          <Bone className="h-5 w-20" />
          <Bone className="h-3.5 w-14" />
        </div>
        <Bone className="h-4 w-24" />
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border mb-8">
      <div className="flex items-center gap-6">
        <Bone className="h-20 w-20 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Bone className="h-6 w-48" />
          <Bone className="h-4 w-64" />
          <Bone className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${cols} gap-4 mb-10`}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-5 border border-border space-y-2">
          <Bone className="h-3 w-24" />
          <Bone className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
