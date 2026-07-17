// app/register/page.tsx
import { Suspense } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { LoaderCircle, BarChart3, Database, ShieldCheck, Trophy } from 'lucide-react';

import { RegisterForm } from '@/components/auth/register-form';

function RegisterFallback() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-white"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        Loading registration...
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
        <Icon className="size-5" aria-hidden="true" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm text-white/75">{description}</p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <main className="min-h-dvh flex flex-col bg-white lg:min-h-screen lg:flex-row">
        <aside className="hidden relative flex-1 flex-col justify-between overflow-hidden bg-indigo-700 px-8 py-16 text-white lg:flex">
          <div className="relative z-10 flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-white/90">
              ForecastMe
            </div>

            <div className="max-w-xl space-y-6">
              <h1 className="text-5xl font-bold leading-tight tracking-tight">
                Multi-Domain Predictive Intelligence Platform
              </h1>
              <p className="max-w-lg text-lg text-white/80">
                Harness the power of evidence-based reporting and explainable AI to navigate global
                markets, sports analytics, and complex datasets with precision.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <FeatureCard
                  icon={BarChart3}
                  title="Data Precision"
                  description="99.4% signal across market and dataset analysis."
                />
                <FeatureCard
                  icon={Trophy}
                  title="Performance"
                  description="Real-time predictive intelligence for every workflow."
                />
                <FeatureCard
                  icon={Database}
                  title="Dataset Intelligence"
                  description="Transform raw data into actionable strategy."
                />
                <FeatureCard
                  icon={ShieldCheck}
                  title="Evidence-Based Research"
                  description="Trustworthy insights backed by rigorous analysis."
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12">
            <p className="text-sm italic text-white/75">
              Trusted by 500+ global intelligence teams
            </p>
          </div>

          <div className="absolute inset-0 opacity-40">
            <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -right-16 -bottom-16 h-72 w-72 rounded-full bg-slate-900/20 blur-3xl" />
          </div>
        </aside>

        <section className="flex w-full flex-1 items-center justify-center bg-white px-6 py-12 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <span className="text-2xl font-semibold text-slate-900">ForecastMe</span>
            </div>
            <RegisterForm />
          </div>
        </section>
      </main>
    </Suspense>
  );
}
