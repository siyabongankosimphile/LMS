export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 px-4 py-12">
      <div className="relative z-10 flex min-h-[calc(100vh-8rem)] items-center justify-center">
        {children}
      </div>
    </div>
  );
}
