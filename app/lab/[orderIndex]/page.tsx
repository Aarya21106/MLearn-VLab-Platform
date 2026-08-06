import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownContent } from "@/components/markdown-content";
import { HintsPanel } from "@/components/hints-panel";
import { SessionTimer } from "@/components/session-timer";
import { Notebook } from "@/components/notebook";
import { requireUser } from "@/lib/auth-helpers";
import { getAllExperiments, getCompletedOrderIndexes, isUnlocked } from "@/lib/experiments";

export default async function ExperimentPage({
  params,
}: {
  params: Promise<{ orderIndex: string }>;
}) {
  const { orderIndex: orderIndexParam } = await params;
  const orderIndex = Number(orderIndexParam);
  if (!Number.isInteger(orderIndex)) notFound();

  const user = await requireUser();
  const [experiments, completed] = await Promise.all([
    getAllExperiments(),
    getCompletedOrderIndexes(user.id),
  ]);

  const experiment = experiments.find((e) => e.orderIndex === orderIndex);
  if (!experiment) notFound();
  if (!isUnlocked(orderIndex, completed)) redirect("/lab");

  return (
    <>
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-foreground">{experiment.title}</h1>
          <Badge variant="secondary" className="font-normal">
            {experiment.syllabusUnit}
          </Badge>
        </div>
        <SessionTimer key={experiment.id} />
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-[65] overflow-y-auto px-6 py-6">
          <Card className="mb-6 border-border bg-card">
            <CardContent className="pt-2">
              <MarkdownContent>{experiment.questionMd}</MarkdownContent>
            </CardContent>
          </Card>

          {experiment.datasetPreviewMd && (
            <div className="mb-6">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Dataset preview - first 5 rows of data.csv
              </p>
              <MarkdownContent>{experiment.datasetPreviewMd}</MarkdownContent>
            </div>
          )}

          <Notebook
            experimentId={experiment.id}
            starterCode={experiment.starterCode}
            datasetUrl={experiment.datasetUrl}
            autograderCode={experiment.autograderCode}
            maxScore={experiment.maxScore}
          />
        </main>

        <aside className="hidden min-w-0 flex-[35] overflow-y-auto border-l border-border bg-muted/20 px-5 py-6 md:block">
          <Tabs defaultValue="concept">
            <TabsList className="w-full">
              <TabsTrigger value="concept" className="flex-1">
                Concept
              </TabsTrigger>
              <TabsTrigger value="hints" className="flex-1">
                Hints
              </TabsTrigger>
            </TabsList>
            <TabsContent value="concept" className="mt-4">
              <MarkdownContent>{experiment.manualMd}</MarkdownContent>
            </TabsContent>
            <TabsContent value="hints" className="mt-4">
              <HintsPanel hintsMd={experiment.hintsMd} />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </>
  );
}
