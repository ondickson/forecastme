'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  LockKeyhole,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react';

import { MobilePageHeader } from '@/components/app-shell/mobile-page-header';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

type DomainPreference =
  | 'Automatic'
  | 'General Research'
  | 'Custom Dataset'
  | 'Sports'
  | 'Financial Markets';

type RiskPreference = 'Conservative' | 'Balanced' | 'Aggressive';

const domainOptions: DomainPreference[] = [
  'Automatic',
  'General Research',
  'Custom Dataset',
  'Sports',
  'Financial Markets',
];

const riskOptions: RiskPreference[] = ['Conservative', 'Balanced', 'Aggressive'];

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  const [defaultDomain, setDefaultDomain] = useState<DomainPreference>('Automatic');

  const [riskPreference, setRiskPreference] = useState<RiskPreference>('Balanced');

  const [analysisCompleted, setAnalysisCompleted] = useState(true);
  const [analysisFailed, setAnalysisFailed] = useState(true);
  const [modelUpdates, setModelUpdates] = useState(false);
  const [changesStaged, setChangesStaged] = useState(false);

  const displayName = user?.displayName?.trim() || 'ForecastMe user';

  const email = user?.email || '';

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setChangesStaged(true);
  }

  function handlePreferenceChange(setter: () => void): void {
    setter();
    setChangesStaged(false);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MobilePageHeader title="Settings" description="Profile and application preferences" />

      <main className="min-h-0 flex-1 overflow-y-auto bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Settings className="size-5" aria-hidden="true" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Settings
                </h1>

                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                  Preview
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Manage your account, default analysis behavior, notifications, and security.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <nav
                aria-label="Settings sections"
                className="sticky top-6 rounded-2xl border bg-background p-3 shadow-sm"
              >
                <SettingsLink href="#profile" icon={UserRound} label="Profile" />

                <SettingsLink
                  href="#preferences"
                  icon={SlidersHorizontal}
                  label="Analysis preferences"
                />

                <SettingsLink href="#notifications" icon={Bell} label="Notifications" />

                <SettingsLink href="#security" icon={ShieldCheck} label="Security" />
              </nav>
            </aside>

            <form onSubmit={handleSubmit} className="min-w-0 space-y-6">
              <section
                id="profile"
                className="scroll-mt-6 rounded-2xl border bg-background shadow-sm"
              >
                <SectionHeader
                  icon={UserRound}
                  title="Profile"
                  description="Your personal account information."
                />

                <div className="space-y-5 p-5 sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-700">
                      {displayName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">{displayName}</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Your profile image and account editing workflow will be connected later.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="display-name" className="text-sm font-medium text-foreground">
                        Display name
                      </label>

                      <Input
                        id="display-name"
                        name="displayName"
                        defaultValue={displayName}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="account-email"
                        className="text-sm font-medium text-foreground"
                      >
                        Email address
                      </label>

                      <div className="relative mt-2">
                        <Mail
                          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />

                        <Input
                          id="account-email"
                          value={email}
                          readOnly
                          className="bg-muted/40 pl-9"
                        />
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground">
                        Email changes require account verification.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section
                id="preferences"
                className="scroll-mt-6 rounded-2xl border bg-background shadow-sm"
              >
                <SectionHeader
                  icon={SlidersHorizontal}
                  title="Analysis preferences"
                  description="Choose default behavior for new requests."
                />

                <div className="space-y-6 p-5 sm:p-6">
                  <fieldset>
                    <legend className="text-sm font-semibold text-foreground">
                      Default domain
                    </legend>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Automatic allows ForecastMe to classify the question.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {domainOptions.map((domain) => {
                        const isSelected = defaultDomain === domain;

                        return (
                          <button
                            key={domain}
                            type="button"
                            onClick={() => handlePreferenceChange(() => setDefaultDomain(domain))}
                            aria-pressed={isSelected}
                            className={cn(
                              'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                              isSelected
                                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                          >
                            {domain}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="text-sm font-semibold text-foreground">
                      Default risk preference
                    </legend>

                    <p className="mt-1 text-sm text-muted-foreground">
                      This controls how uncertainty and risk are presented by default.
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {riskOptions.map((risk) => {
                        const isSelected = riskPreference === risk;

                        return (
                          <button
                            key={risk}
                            type="button"
                            onClick={() => handlePreferenceChange(() => setRiskPreference(risk))}
                            aria-pressed={isSelected}
                            className={cn(
                              'rounded-xl border p-4 text-left transition-colors',
                              isSelected
                                ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-100'
                                : 'border-border bg-background hover:bg-muted/50',
                            )}
                          >
                            <span
                              className={cn(
                                'text-sm font-semibold',
                                isSelected ? 'text-indigo-700' : 'text-foreground',
                              )}
                            >
                              {risk}
                            </span>

                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                              {getRiskDescription(risk)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
              </section>

              <section
                id="notifications"
                className="scroll-mt-6 rounded-2xl border bg-background shadow-sm"
              >
                <SectionHeader
                  icon={Bell}
                  title="Notifications"
                  description="Control which ForecastMe updates you receive."
                />

                <div className="divide-y px-5 sm:px-6">
                  <NotificationSetting
                    title="Completed analyses"
                    description="Notify me when an analysis finishes successfully."
                    checked={analysisCompleted}
                    onChange={() =>
                      handlePreferenceChange(() => setAnalysisCompleted((current) => !current))
                    }
                  />

                  <NotificationSetting
                    title="Failed analyses"
                    description="Notify me when an analysis needs attention."
                    checked={analysisFailed}
                    onChange={() =>
                      handlePreferenceChange(() => setAnalysisFailed((current) => !current))
                    }
                  />

                  <NotificationSetting
                    title="Model updates"
                    description="Notify me when model versions or evaluations change."
                    checked={modelUpdates}
                    onChange={() =>
                      handlePreferenceChange(() => setModelUpdates((current) => !current))
                    }
                  />
                </div>
              </section>

              <section
                id="security"
                className="scroll-mt-6 rounded-2xl border bg-background shadow-sm"
              >
                <SectionHeader
                  icon={ShieldCheck}
                  title="Security"
                  description="Review your account protection and sessions."
                />

                <div className="space-y-4 p-5 sm:p-6">
                  <SecurityStatus
                    title="Password authentication"
                    description="Your account is protected with email and password authentication."
                  />

                  <SecurityStatus
                    title="Protected application routes"
                    description="ForecastMe verifies your authenticated session before displaying workspace data."
                  />

                  <SecurityStatus
                    title="Refresh-token rotation"
                    description="Refresh tokens are rotated when your session is renewed."
                  />

                  <div className="flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <LockKeyhole className="size-4" aria-hidden="true" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-foreground">Change password</p>

                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          Password-management controls will be added in a later authentication
                          milestone.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled
                      className="inline-flex h-9 shrink-0 cursor-not-allowed items-center justify-center rounded-lg border bg-muted px-3 text-sm font-medium text-muted-foreground opacity-70"
                    >
                      Coming later
                    </button>
                  </div>
                </div>
              </section>

              <div className="sticky bottom-0 flex flex-col justify-between gap-3 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center">
                <div>
                  {changesStaged ? (
                    <p
                      role="status"
                      className="flex items-center gap-2 text-sm font-medium text-emerald-700"
                    >
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      Changes staged in this UI preview.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Settings persistence is not connected yet.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                >
                  <Save className="size-4" aria-hidden="true" />
                  Save preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

interface SettingsLinkProps {
  href: string;
  icon: typeof Settings;
  label: string;
}

function SettingsLink({ href, icon: Icon, label }: SettingsLinkProps) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </a>
  );
}

interface SectionHeaderProps {
  icon: typeof Settings;
  title: string;
  description: string;
}

function SectionHeader({ icon: Icon, title, description }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 border-b px-5 py-4 sm:px-6">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
        <Icon className="size-4" aria-hidden="true" />
      </div>

      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface NotificationSettingProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function NotificationSetting({ title, description, checked, onChange }: NotificationSettingProps) {
  return (
    <div className="flex items-center justify-between gap-5 py-5">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>

        <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={onChange}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2',
          checked ? 'bg-indigo-700' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}

interface SecurityStatusProps {
  title: string;
  description: string;
}

function SecurityStatus({ title, description }: SecurityStatusProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="size-4" aria-hidden="true" />
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>

        <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function getRiskDescription(risk: RiskPreference): string {
  switch (risk) {
    case 'Conservative':
      return 'Emphasize uncertainty and lower-risk conclusions.';
    case 'Aggressive':
      return 'Accept more uncertainty in pursuit of stronger opportunities.';
    default:
      return 'Balance potential opportunity against uncertainty and risk.';
  }
}
