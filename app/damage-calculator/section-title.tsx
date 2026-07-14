export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.03em] text-slate-300">
      <span className="text-slate-500">+</span>
      {children}
    </h2>
  );
}

