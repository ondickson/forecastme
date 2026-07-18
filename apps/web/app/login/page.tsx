// app/login/page.tsx
import { Suspense } from 'react';
import { LoaderCircle, BarChart3, Database, ShieldCheck, Trophy } from 'lucide-react';

import { LoginForm } from '@/components/auth/login-form';

function LoginFallback() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-white"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        Loading sign-in...
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
        <Icon className="size-5" aria-hidden="true" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm text-white/70">{description}</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <main className="min-h-dvh flex flex-col bg-white lg:min-h-screen lg:flex-row">
        <div className="flex flex-1 items-center justify-center bg-white px-6 py-16">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>

        <aside className="hidden flex-1 flex-col items-center justify-center bg-indigo-700 px-8 py-16 text-white lg:flex">
          <div className="w-full max-w-xl">
            <h2 className="text-5xl font-bold leading-tight tracking-tight">
              Predictive Intelligence for Modern Enterprise.
            </h2>

            <p className="mt-6 max-w-xl text-lg text-white/80">
              Harness the power of evidence-based reporting and real-time dataset intelligence to
              drive critical decisions.
            </p>

            <div className="mt-12 grid gap-4 md:grid-cols-2">
              <FeatureCard
                icon={BarChart3}
                title="Financial Forecasting"
                description="Deep-market analysis and trend projection models."
              />
              <FeatureCard
                icon={Trophy}
                title="Sports Analytics"
                description="Performance metrics and predictive outcome engines."
              />
              <FeatureCard
                icon={Database}
                title="Dataset Intelligence"
                description="Raw data transformation into actionable strategy."
              />
              <FeatureCard
                icon={ShieldCheck}
                title="Evidence-Based Research"
                description="Peer-reviewed logic for high-stakes reporting."
              />
            </div>

            <p className="mt-12 text-sm italic text-white/70">
              Trusted by 500+ global intelligence teams
            </p>
          </div>
        </aside>
      </main>
    </Suspense>
  );
}
