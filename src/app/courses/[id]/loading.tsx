export default function CourseLoading() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 py-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="hidden h-80 rounded border border-slate-200 bg-white lg:col-span-3 lg:block" />
          <div className="space-y-4 lg:col-span-6">
            <div className="h-40 rounded border border-slate-200 bg-white" />
            <div className="h-72 rounded border border-slate-200 bg-white" />
          </div>
          <div className="space-y-4 lg:col-span-3">
            <div className="h-32 rounded border border-slate-200 bg-white" />
            <div className="h-32 rounded border border-slate-200 bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
