export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">ForecastMe</p>

        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Design system foundation
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Tailwind CSS is configured and ready for shared ForecastMe components.
        </p>

        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="font-medium">Tailwind verification card</p>
          <p className="mt-2 text-sm text-slate-600">
            Responsive utilities, spacing, typography, borders, and shadows are active.
          </p>
        </div>
      </div>
    </main>
  );
}
