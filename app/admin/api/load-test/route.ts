import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60; // Allow up to 60s for the load test

export async function POST() {
  try {
    await requireAdmin();

    const CONCURRENT_USERS = 130;
    const startTime = Date.now();

    // Prepare arrays to track metrics
    const latencies: number[] = [];
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Create 130 unique dummy user email/ID combinations
    const testBatchId = `loadtest_${Date.now()}`;
    
    // We execute concurrent mock database requests
    const tasks = Array.from({ length: CONCURRENT_USERS }).map(async (_, index) => {
      const studentId = `test_student_${testBatchId}_${index}`;
      const email = `${studentId}@example.com`;
      const taskStart = Date.now();

      try {
        // 1. Create/Upsert Student
        const user = await prisma.user.upsert({
          where: { email },
          update: { displayName: `LoadTest Student ${index}` },
          create: {
            id: studentId,
            email,
            name: `LoadTest Student ${index}`,
            displayName: `LoadTest Student ${index}`,
            role: "STUDENT",
          },
        });

        // Get an experiment to submit for
        const experiment = await prisma.experiment.findFirst({
          select: { id: true },
        });

        if (experiment) {
          // 2. Create Submission (Simulate Autosave)
          const submission = await prisma.submission.create({
            data: {
              userId: user.id,
              experimentId: experiment.id,
              code: `# simulated code for ${studentId}`,
              outputLog: "{}",
              status: "IN_PROGRESS",
              attemptNumber: 1,
              timeSpentSeconds: 42,
            },
          });

          // 3. Update Submission (Simulate submit grading result)
          await prisma.submission.update({
            where: { id: submission.id },
            data: {
              status: "COMPLETED",
              score: 10,
              autograderReport: JSON.stringify({
                score: 10,
                passed_checks: ["check1"],
                failed_checks: [],
                message: "Perfect score",
              }),
            },
          });

          // 4. Log an activity event
          await prisma.activityEvent.create({
            data: {
              userId: user.id,
              type: "submit",
              experimentId: experiment.id,
              metadata: { score: 10, status: "COMPLETED" },
            },
          });
        }

        const taskEnd = Date.now();
        latencies.push(taskEnd - taskStart);
        successCount++;
      } catch (err: unknown) {
        failureCount++;
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push(errMsg);
      } finally {
        // Always clean up this task's rows, however far it got - a task that
        // fails partway (e.g. hitting Supabase's free-tier connection limit,
        // the exact thing this tool is meant to probe) must not leave a
        // permanent fake student row polluting the real admin stats.
        // deleteMany (not delete) so a step that never ran is a silent no-op
        // rather than a "record not found" throw, and children are removed
        // before the parent User row to satisfy the FK constraint.
        await prisma.activityEvent.deleteMany({ where: { userId: studentId } }).catch(() => {});
        await prisma.submission.deleteMany({ where: { userId: studentId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: studentId } }).catch(() => {});
      }
    });

    // Run all 130 operations concurrently
    await Promise.all(tasks);

    const totalTime = Date.now() - startTime;
    const avgLatency = latencies.length
      ? latencies.reduce((sum, val) => sum + val, 0) / latencies.length
      : 0;
    const minLatency = latencies.length ? Math.min(...latencies) : 0;
    const maxLatency = latencies.length ? Math.max(...latencies) : 0;

    return NextResponse.json({
      success: true,
      concurrency: CONCURRENT_USERS,
      totalTimeMs: totalTime,
      averageLatencyMs: Math.round(avgLatency),
      minLatencyMs: minLatency,
      maxLatencyMs: maxLatency,
      successCount,
      failureCount,
      errors: errors.slice(0, 10), // return first 10 errors if any
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to run load test";
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
