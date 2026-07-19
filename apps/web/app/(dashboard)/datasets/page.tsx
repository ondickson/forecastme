'use client';

import type { ChangeEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Braces,
  CheckCircle2,
  Columns3,
  Database,
  FileSpreadsheet,
  HardDrive,
  LoaderCircle,
  Rows3,
  Search,
  Upload,
  X,
} from 'lucide-react';

import { MobilePageHeader } from '@/components/app-shell/mobile-page-header';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type DatasetType = 'CSV' | 'Excel' | 'JSON';
type DatasetFilter = 'All' | DatasetType;
type DatasetStatus = 'Ready' | 'Processing';

interface MockDataset {
  id: string;
  name: string;
  description: string;
  type: DatasetType;
  status: DatasetStatus;
  rows: number;
  columns: number;
  size: string;
  updatedAt: string;
}

const datasets: MockDataset[] = [
  {
    id: 'dataset-001',
    name: 'Premier League Match History',
    description:
      'Historical fixtures, results, goals, possession, shots, and team performance statistics.',
    type: 'CSV',
    status: 'Ready',
    rows: 2840,
    columns: 24,
    size: '4.8 MB',
    updatedAt: 'Today, 8:46 AM',
  },
  {
    id: 'dataset-002',
    name: 'S&P 500 Daily Market Data',
    description: 'Daily price, volume, volatility, moving averages, and market-return indicators.',
    type: 'CSV',
    status: 'Ready',
    rows: 6214,
    columns: 18,
    size: '2.6 MB',
    updatedAt: 'Yesterday, 6:12 PM',
  },
  {
    id: 'dataset-003',
    name: 'Customer Churn Records',
    description:
      'Customer activity, subscription history, support interactions, and churn outcomes.',
    type: 'Excel',
    status: 'Ready',
    rows: 1450,
    columns: 31,
    size: '1.2 MB',
    updatedAt: 'Jul 16, 2026',
  },
  {
    id: 'dataset-004',
    name: 'Macroeconomic Indicators',
    description:
      'Structured inflation, employment, interest-rate, and economic growth observations.',
    type: 'JSON',
    status: 'Processing',
    rows: 892,
    columns: 14,
    size: '640 KB',
    updatedAt: 'Jul 15, 2026',
  },
];

const filters: DatasetFilter[] = ['All', 'CSV', 'Excel', 'JSON'];

const typeIcons: Record<DatasetType, LucideIcon> = {
  CSV: FileSpreadsheet,
  Excel: FileSpreadsheet,
  JSON: Braces,
};

const typeStyles: Record<DatasetType, string> = {
  CSV: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Excel: 'bg-blue-50 text-blue-700 ring-blue-200',
  JSON: 'bg-amber-50 text-amber-700 ring-amber-200',
};

const statusStyles: Record<DatasetStatus, string> = {
  Ready: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Processing: 'bg-amber-50 text-amber-700 ring-amber-200',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DatasetsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DatasetFilter>('All');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const filteredDatasets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return datasets.filter((dataset) => {
      const matchesType = typeFilter === 'All' || dataset.type === typeFilter;

      const matchesQuery =
        !normalizedQuery ||
        dataset.name.toLowerCase().includes(normalizedQuery) ||
        dataset.description.toLowerCase().includes(normalizedQuery) ||
        dataset.type.toLowerCase().includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [query, typeFilter]);

  const readyCount = datasets.filter((dataset) => dataset.status === 'Ready').length;

  const processingCount = datasets.filter((dataset) => dataset.status === 'Processing').length;

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  function handleClearSelection(): void {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MobilePageHeader title="Datasets" description="Uploaded and connected data" />

      <main className="min-h-0 flex-1 overflow-y-auto bg-muted/30">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Database className="size-5" aria-hidden="true" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Datasets
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Upload, organize, and inspect data used by ForecastMe analysis workflows.
              </p>
            </div>
          </div>

          <section
            aria-label="Dataset summary"
            className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <SummaryCard
              label="Total datasets"
              value={String(datasets.length)}
              icon={Database}
              iconClassName="bg-indigo-50 text-indigo-700"
            />

            <SummaryCard
              label="Ready"
              value={String(readyCount)}
              icon={CheckCircle2}
              iconClassName="bg-emerald-50 text-emerald-700"
            />

            <SummaryCard
              label="Processing"
              value={String(processingCount)}
              icon={LoaderCircle}
              iconClassName="bg-amber-50 text-amber-700"
            />

            <SummaryCard
              label="Storage used"
              value="9.2 MB"
              icon={HardDrive}
              iconClassName="bg-blue-50 text-blue-700"
            />
          </section>

          <section className="mt-6 rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Upload a dataset</h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Select a CSV, Excel, or JSON file. Dataset storage and profiling will be connected
                  in a later milestone.
                </p>
              </div>

              <input
                ref={fileInputRef}
                id="dataset-upload"
                type="file"
                accept=".csv,.xls,.xlsx,.json"
                onChange={handleFileSelection}
                className="sr-only"
              />

              <label
                htmlFor="dataset-upload"
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800 focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2"
              >
                <Upload className="size-4" aria-hidden="true" />
                Choose dataset
              </label>
            </div>

            <div className="mt-5 rounded-xl border border-dashed bg-muted/20 p-5">
              {selectedFile ? (
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                      <FileSpreadsheet className="size-5" aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-semibold text-foreground"
                        title={selectedFile.name}
                      >
                        {selectedFile.name}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)} · Selected locally
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-4 py-6 text-center">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Upload className="size-5" aria-hidden="true" />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-foreground">No file selected</p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Supported formats: CSV, XLS, XLSX, and JSON
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl border bg-background shadow-sm">
            <div className="border-b p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <Input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search datasets..."
                    className="pl-9"
                    aria-label="Search datasets"
                  />
                </div>

                <div className="flex flex-wrap gap-2" aria-label="Filter datasets by file type">
                  {filters.map((filter) => {
                    const isSelected = typeFilter === filter;

                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setTypeFilter(filter)}
                        aria-pressed={isSelected}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                          isSelected
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-foreground">Available datasets</h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Preview data representing the future dataset library.
                  </p>
                </div>

                <span className="text-sm text-muted-foreground">
                  {filteredDatasets.length} {filteredDatasets.length === 1 ? 'dataset' : 'datasets'}
                </span>
              </div>

              {filteredDatasets.length > 0 ? (
                <div className="space-y-3">
                  {filteredDatasets.map((dataset) => (
                    <DatasetCard key={dataset.id} dataset={dataset} />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Search className="size-5" aria-hidden="true" />
                  </div>

                  <h3 className="mt-4 font-semibold text-foreground">No datasets found</h3>

                  <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                    Try another search term or choose a different file type.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName: string;
}

function SummaryCard({ label, value, icon: Icon, iconClassName }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
        </div>

        <div className={cn('flex size-10 items-center justify-center rounded-xl', iconClassName)}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

interface DatasetCardProps {
  dataset: MockDataset;
}

function DatasetCard({ dataset }: DatasetCardProps) {
  const TypeIcon = typeIcons[dataset.type];
  const StatusIcon = dataset.status === 'Ready' ? CheckCircle2 : LoaderCircle;

  return (
    <article className="rounded-xl border bg-background p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/20 sm:p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
              typeStyles[dataset.type],
            )}
          >
            <TypeIcon className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground">{dataset.name}</h3>

              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                  statusStyles[dataset.status],
                )}
              >
                <StatusIcon
                  className={cn(
                    'size-3.5',
                    dataset.status === 'Processing' && 'animate-spin motion-reduce:animate-none',
                  )}
                  aria-hidden="true"
                />
                {dataset.status}
              </span>
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {dataset.description}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Rows3 className="size-3.5" aria-hidden="true" />
                {dataset.rows.toLocaleString()} rows
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Columns3 className="size-3.5" aria-hidden="true" />
                {dataset.columns} columns
              </span>

              <span className="inline-flex items-center gap-1.5">
                <HardDrive className="size-3.5" aria-hidden="true" />
                {dataset.size}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t pt-4 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Last updated
          </p>

          <p className="mt-1 whitespace-nowrap text-sm font-medium text-foreground">
            {dataset.updatedAt}
          </p>
        </div>
      </div>
    </article>
  );
}
