type ModulePageShellProps = {
  title: string;
  description: string;
  section: string;
};

export function ModulePageShell({
  title,
  description,
  section,
}: ModulePageShellProps) {
  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border border-black/5 bg-white/90 p-6 shadow-sm">
        <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1 text-xs font-medium text-emerald-800">
          {section}
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-500">
          {description}
        </p>
      </section>
    </div>
  );
}
