export function ConversationWorkspace() {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">New Analysis</h1>

        <p className="mt-1 text-sm text-muted-foreground">Ask ForecastMe a question.</p>
      </div>

      <div className="flex-1 p-4 sm:p-6">
        <div className="flex h-full min-h-80 items-center justify-center rounded-xl border border-dashed bg-muted/20">
          <p className="text-sm text-muted-foreground">Conversation workspace placeholder</p>
        </div>
      </div>
    </section>
  );
}
