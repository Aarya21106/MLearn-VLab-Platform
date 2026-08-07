"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, AlertCircle, CheckCircle2, Loader2, Users, ArrowLeft } from "lucide-react";

type LoadTestResult = {
  success: boolean;
  concurrency: number;
  totalTimeMs: number;
  averageLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  successCount: number;
  failureCount: number;
  errors: string[];
};

export default function LoadTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LoadTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startLoadTest() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/admin/api/load-test", {
        method: "POST",
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        // The platform (not our own route code) terminated the request before
        // it could respond - e.g. a serverless function timeout. Vercel's own
        // error page is plain text/HTML, not JSON, so res.json() would throw
        // a cryptic "Unexpected token" parse error instead of a clear message.
        throw new Error(
          res.status === 504 || res.status === 502
            ? "The load test exceeded the server's execution time limit and was terminated by the platform before finishing. This can happen at 130 concurrency on a free-tier plan - the function's actual time budget may be shorter than the 60s this tool requests."
            : `Server returned an unexpected non-JSON response (status ${res.status}).`
        );
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to complete load test");
      }
      setResult(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An error occurred while running the load test";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-10 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-1.5 cursor-pointer">
              <ArrowLeft className="size-4" />
              Overview
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="size-6 text-yellow-500 fill-yellow-500" />
            Performance & Load Testing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Simulate high concurrency loads of 130 concurrent student sessions to evaluate database capacity and API response latency.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Run Load Simulation</CardTitle>
              <CardDescription>
                This executes 130 concurrent user lifecycles in parallel. Each session performs student registration upsert, submissions saving (autosave), submission update (scoring), activity event logging, and subsequent resource cleanup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-lg border border-border">
                  <Users className="size-8 text-primary/70 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">Target Concurrency: 130 Concurrent Users</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Executes on Vercel backend directly to Supabase AP-South-1 region.</p>
                  </div>
                </div>

                <Button
                  onClick={startLoadTest}
                  disabled={loading}
                  size="lg"
                  className="w-full relative overflow-hidden transition-all duration-300 transform active:scale-95 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Load Test... (Simulating 130 Users)
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Execute Load Test
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Testing Gates</CardTitle>
              <CardDescription>Metrics expected for successful free-tier validation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Success Rate Target</p>
                <p className="text-xs text-muted-foreground">100% completion (130 / 130 successful sessions).</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Average Latency Target</p>
                <p className="text-xs text-muted-foreground">Under 1500ms per database CRUD session lifecycle.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Free Tier Connection Limit</p>
                <p className="text-xs text-muted-foreground">Supabase allows up to ~60 direct connection pools (boosted automatically via Supabase transaction poolers to support hundreds of concurrent sessions).</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Load Simulation Failed</h4>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Simulation Report</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  Completed Successfully
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="bg-muted/40 p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground font-medium">Total Execution Time</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{(result.totalTimeMs / 1000).toFixed(2)}s</p>
                </div>
                <div className="bg-muted/40 p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground font-medium">Avg User Latency</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{result.averageLatencyMs}ms</p>
                </div>
                <div className="bg-muted/40 p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground font-medium">Min / Max Latency</p>
                  <p className="text-xl font-bold mt-1.5 text-foreground">{result.minLatencyMs}ms / {result.maxLatencyMs}ms</p>
                </div>
                <div className="bg-muted/40 p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground font-medium">Success Rate</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">
                    {result.successCount} / {result.concurrency}
                  </p>
                </div>
              </div>

              {result.failureCount > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-destructive mb-2">Errors Encounted ({result.failureCount})</h4>
                  <ul className="list-disc pl-5 text-xs text-destructive space-y-1">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
