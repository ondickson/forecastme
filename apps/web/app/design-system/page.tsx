import { AlertCircle, ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

const sectionClassName = 'space-y-6';
const sectionHeadingClassName = 'text-2xl font-semibold tracking-tight';
const sectionDescriptionClassName = 'max-w-2xl text-sm leading-6 text-muted-foreground';

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
        <header className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              ForecastMe
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Design system foundation
            </h1>
          </div>

          <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            Reusable interface primitives, typography, spacing, forms, feedback states, and
            responsive conventions for the ForecastMe web application.
          </p>
        </header>

        <Separator />

        <section className={sectionClassName} aria-labelledby="typography-heading">
          <div className="space-y-2">
            <h2 id="typography-heading" className={sectionHeadingClassName}>
              Typography
            </h2>
            <p className={sectionDescriptionClassName}>
              A restrained hierarchy for application headings, supporting text, labels, and
              analytical content.
            </p>
          </div>

          <Card>
            <CardContent className="space-y-6 pt-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Display
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  Predictive intelligence, clearly explained.
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Heading
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                  Financial-market risk assessment
                </h3>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Body
                </p>
                <p className="mt-2 max-w-3xl leading-7 text-muted-foreground">
                  ForecastMe separates calculated outputs from AI-assisted explanations so users
                  can distinguish model evidence, uncertainty, and interpretation.
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Supporting text
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Updated from the latest available analysis inputs.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className={sectionClassName} aria-labelledby="buttons-heading">
          <div className="space-y-2">
            <h2 id="buttons-heading" className={sectionHeadingClassName}>
              Buttons
            </h2>
            <p className={sectionDescriptionClassName}>
              Standard actions, secondary actions, destructive operations, and compact controls.
            </p>
          </div>

          <Card>
            <CardContent className="flex flex-wrap gap-3 pt-6">
              <Button>
                New analysis
                <ArrowRight aria-hidden="true" />
              </Button>
              <Button variant="secondary">Save analysis</Button>
              <Button variant="outline">View history</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="destructive">Delete analysis</Button>
              <Button disabled>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Processing
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className={sectionClassName} aria-labelledby="forms-heading">
          <div className="space-y-2">
            <h2 id="forms-heading" className={sectionHeadingClassName}>
              Form components
            </h2>
            <p className={sectionDescriptionClassName}>
              Labels remain programmatically associated with fields, and supporting text explains
              expected input.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create an analysis</CardTitle>
              <CardDescription>
                Enter a question and optional context for the analysis service.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="analysis-title">Analysis title</Label>
                <Input
                  id="analysis-title"
                  name="analysis-title"
                  placeholder="Example: England vs Argentina"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="analysis-question">Question</Label>
                <Textarea
                  id="analysis-question"
                  name="analysis-question"
                  placeholder="What outcome should ForecastMe evaluate?"
                  rows={5}
                />
                <p className="text-sm text-muted-foreground">
                  Include the event, market, time horizon, and any relevant constraints.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="disabled-field">Unavailable field</Label>
                <Input
                  id="disabled-field"
                  value="Enabled in a later workflow"
                  disabled
                  readOnly
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline">Clear</Button>
              <Button>Submit analysis</Button>
            </CardFooter>
          </Card>
        </section>

        <section className={sectionClassName} aria-labelledby="cards-heading">
          <div className="space-y-2">
            <h2 id="cards-heading" className={sectionHeadingClassName}>
              Cards
            </h2>
            <p className={sectionDescriptionClassName}>
              Cards group related information without replacing the page hierarchy.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Probability</CardDescription>
                <CardTitle className="text-3xl">68%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  Estimated outcome probability based on currently available inputs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Confidence</CardDescription>
                <CardTitle className="text-3xl">Moderate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  Confidence is constrained by limited sample size and uncertain team availability.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Risk level</CardDescription>
                <CardTitle className="text-3xl">Elevated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  The projected advantage is not large enough to justify aggressive exposure.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className={sectionClassName} aria-labelledby="dialog-heading">
          <div className="space-y-2">
            <h2 id="dialog-heading" className={sectionHeadingClassName}>
              Dialog
            </h2>
            <p className={sectionDescriptionClassName}>
              Dialogs are reserved for focused decisions that require explicit confirmation.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Dialog>
                <DialogTrigger render={<Button variant="outline" />}>
                  Open confirmation dialog
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete this analysis?</DialogTitle>
                    <DialogDescription>
                      This removes the saved analysis and its associated result. This action cannot
                      be undone.
                    </DialogDescription>
                  </DialogHeader>

                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                    <Button variant="destructive">Delete analysis</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </section>

        <section className={sectionClassName} aria-labelledby="feedback-heading">
          <div className="space-y-2">
            <h2 id="feedback-heading" className={sectionHeadingClassName}>
              Feedback states
            </h2>
            <p className={sectionDescriptionClassName}>
              Loading, success, warning, and failure states communicate system status without
              relying on color alone.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Loading state</CardTitle>
                <CardDescription>Placeholder content while analysis data loads.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Alert>
                <CheckCircle2 aria-hidden="true" />
                <AlertTitle>Analysis saved</AlertTitle>
                <AlertDescription>
                  The result is now available in your analysis history.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertCircle aria-hidden="true" />
                <AlertTitle>Analysis failed</AlertTitle>
                <AlertDescription>
                  The analysis service could not process this request. Retry or review the request
                  details.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </section>

        <Separator />

        <footer className="text-sm leading-6 text-muted-foreground">
          ForecastMe design-system verification route. Components shown here are development
          references and not final product screens.
        </footer>
      </div>
    </main>
  );
}
