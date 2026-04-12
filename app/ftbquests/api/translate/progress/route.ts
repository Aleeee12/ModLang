import { getTranslationJob } from "../../../lib/translateJobs";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return Response.json(
      { ok: false, error: "Falta jobId." },
      { status: 400 }
    );
  }

  const job = getTranslationJob(jobId);

  if (!job) {
    return Response.json(
      { ok: false, error: "Trabajo no encontrado." },
      { status: 404 }
    );
  }

  return Response.json({
    ok: true,
    jobId: job.id,
    state: job.state,
    stageLabel: job.stageLabel,
    currentStage: job.currentStage,
    currentFile: job.currentFile,
    totalTexts: job.totalTexts,
    completedTexts: job.completedTexts,
    progress: job.progress,
    etaSeconds: job.etaSeconds,
    done: job.state === "done",
    error: job.error,
  });
}