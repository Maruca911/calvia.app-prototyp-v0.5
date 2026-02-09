export default function DealsLoading() {
  return (
    <div className="px-5 py-6 animate-fade-in">
      <div className="mb-6">
        <div className="h-8 w-48 bg-cream-200 rounded animate-pulse mb-2" />
        <div className="h-5 w-64 bg-cream-200 rounded animate-pulse" />
      </div>
      <div className="flex gap-2 pb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-9 w-20 bg-cream-200 rounded-full animate-pulse flex-shrink-0" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl overflow-hidden border border-cream-200">
            <div className="h-40 bg-cream-200 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-3/4 bg-cream-200 rounded animate-pulse" />
              <div className="h-4 bg-cream-200 rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-cream-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
