'use client';

import { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, LoaderCircle, Paperclip, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { analysisFormSchema, MAX_QUESTION_LENGTH } from '@/lib/analysis/analysis-form-schema';
import type {
  AnalysisDomain,
  AnalysisFormValues,
  RiskPreference,
  TimeHorizon,
} from '@/types/analysis';

const DEFAULT_VALUES: AnalysisFormValues = {
  question: '',
  domain: 'GENERAL_RESEARCH',
  timeHorizon: 'NEXT_7_DAYS',
  riskPreference: 'BALANCED',
  attachment: null,
};

const DOMAIN_OPTIONS: ReadonlyArray<{
  value: AnalysisDomain;
  label: string;
}> = [
  { value: 'GENERAL_RESEARCH', label: 'General Research' },
  { value: 'CUSTOM_DATASET', label: 'Custom Dataset' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'FINANCIAL_MARKET', label: 'Financial Market' },
];

const TIME_HORIZON_OPTIONS: ReadonlyArray<{
  value: TimeHorizon;
  label: string;
}> = [
  { value: 'IMMEDIATE', label: 'Immediate' },
  { value: 'NEXT_24_HOURS', label: 'Next 24 hours' },
  { value: 'NEXT_7_DAYS', label: 'Next 7 days' },
  { value: 'NEXT_30_DAYS', label: 'Next 30 days' },
  { value: 'NEXT_3_MONTHS', label: 'Next 3 months' },
  { value: 'NEXT_12_MONTHS', label: 'Next 12 months' },
  { value: 'LONG_TERM', label: 'Long term' },
];

const RISK_OPTIONS: ReadonlyArray<{
  value: RiskPreference;
  label: string;
}> = [
  { value: 'CONSERVATIVE', label: 'Conservative' },
  { value: 'BALANCED', label: 'Balanced' },
  { value: 'AGGRESSIVE', label: 'Aggressive' },
];

const RISK_DESCRIPTIONS: Record<RiskPreference, string> = {
  CONSERVATIVE: 'Prioritize lower uncertainty and downside protection.',
  BALANCED: 'Balance potential opportunity with reasonable risk controls.',
  AGGRESSIVE: 'Accept greater uncertainty in pursuit of higher potential returns.',
};

const selectClassName =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30';

interface AnalysisInputFormProps {
  isSubmitting: boolean;
  apiError: string | null;
  onSubmit: (values: AnalysisFormValues) => Promise<void>;
  onCancel: () => void;
  onClearApiError: () => void;
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function AnalysisInputForm({
  isSubmitting,
  apiError,
  onSubmit: submitAnalysis,
  onCancel,
  onClearApiError,
}: AnalysisInputFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<AnalysisFormValues>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  const question = watch('question');
  const attachment = watch('attachment');
  const riskPreference = watch('riskPreference');

  const submitForm = handleSubmit(async (values) => {
    if (isSubmitting) {
      return;
    }

    try {
      await submitAnalysis(values);
    } catch {
      // The parent exposes the normalized API error through apiError.
    }
  });

  function resetForm(): void {
    reset(DEFAULT_VALUES);
    clearErrors();
    onClearApiError();
    onCancel();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function requestCancel(): void {
    if (isSubmitting) {
      return;
    }

    if (isDirty) {
      setDiscardDialogOpen(true);
      return;
    }

    resetForm();
  }

  function confirmDiscard(): void {
    setDiscardDialogOpen(false);
    resetForm();
  }

  function removeAttachment(): void {
    setValue('attachment', null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    onClearApiError();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <>
      <form
        className="mx-auto w-full max-w-3xl space-y-6"
        onSubmit={submitForm}
        noValidate
        aria-busy={isSubmitting}
      >
        {apiError ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Unable to submit analysis</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="analysis-question">Analysis question</Label>

            <span className="text-xs text-muted-foreground" aria-live="polite">
              {question.length.toLocaleString()} / {MAX_QUESTION_LENGTH.toLocaleString()}
            </span>
          </div>

          <Textarea
            id="analysis-question"
            className="min-h-40 resize-y"
            placeholder="What would you like ForecastMe to analyze?"
            maxLength={MAX_QUESTION_LENGTH}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.question)}
            aria-describedby={
              errors.question
                ? 'analysis-question-guidance analysis-question-error'
                : 'analysis-question-guidance'
            }
            {...register('question', {
              onChange: onClearApiError,
            })}
          />

          <p id="analysis-question-guidance" className="text-xs text-muted-foreground">
            Describe the event, outcome, market, or dataset you want assessed.
          </p>

          {errors.question ? (
            <p id="analysis-question-error" className="text-sm text-destructive" role="alert">
              {errors.question.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="analysis-domain">Domain</Label>

            <select
              id="analysis-domain"
              className={selectClassName}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.domain)}
              aria-describedby={errors.domain ? 'analysis-domain-error' : undefined}
              {...register('domain', {
                onChange: onClearApiError,
              })}
            >
              {DOMAIN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {errors.domain ? (
              <p id="analysis-domain-error" className="text-sm text-destructive" role="alert">
                {errors.domain.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-horizon">Time horizon</Label>

            <select
              id="time-horizon"
              className={selectClassName}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.timeHorizon)}
              aria-describedby={errors.timeHorizon ? 'time-horizon-error' : undefined}
              {...register('timeHorizon', {
                onChange: onClearApiError,
              })}
            >
              {TIME_HORIZON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {errors.timeHorizon ? (
              <p id="time-horizon-error" className="text-sm text-destructive" role="alert">
                {errors.timeHorizon.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk-preference">Risk preference</Label>

            <select
              id="risk-preference"
              className={selectClassName}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.riskPreference)}
              aria-describedby="risk-preference-description"
              {...register('riskPreference', {
                onChange: onClearApiError,
              })}
            >
              {RISK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <p id="risk-preference-description" className="text-xs text-muted-foreground">
              {RISK_DESCRIPTIONS[riskPreference]}
            </p>

            {errors.riskPreference ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.riskPreference.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="analysis-attachment">Optional data file</Label>

          <Input
            ref={fileInputRef}
            id="analysis-attachment"
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.attachment)}
            aria-describedby={
              errors.attachment ? 'attachment-guidance attachment-error' : 'attachment-guidance'
            }
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;

              setValue('attachment', file, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });

              onClearApiError();
            }}
          />

          <p id="attachment-guidance" className="text-xs text-muted-foreground">
            CSV, Excel or JSON, up to 10 MB. File upload and parsing are not enabled yet.
          </p>

          {errors.attachment ? (
            <p id="attachment-error" className="text-sm text-destructive" role="alert">
              {errors.attachment.message}
            </p>
          ) : null}

          {attachment ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={removeAttachment}
                disabled={isSubmitting}
                aria-label={`Remove ${attachment.name}`}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={requestCancel} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              'Submit analysis'
            )}
          </Button>
        </div>
      </form>

      <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard this analysis request?</DialogTitle>
            <DialogDescription>
              Your question, selections and chosen attachment will be cleared.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Keep editing
            </DialogClose>

            <Button type="button" variant="destructive" onClick={confirmDiscard}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
