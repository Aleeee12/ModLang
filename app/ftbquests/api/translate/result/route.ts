import {
  getJobResultResponse,
  getTranslationJob,
} from "../../../lib/translateJobs";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return new Response("Falta jobId.", { status: 400 });
  }

  const job = getTranslationJob(jobId);

  if (!job) {
    return new Response("Trabajo no encontrado.", { status: 404 });
  }

  if (job.state === "error") {
    return new Response(job.error || "La traducción falló.", { status: 500 });
  }

  if (job.state !== "done") {
    return new Response("El resultado aún no está listo.", { status: 409 });
  }

  const response = getJobResultResponse(job);

  if (!response) {
    return new Response("No hay resultado disponible.", { status: 404 });
  }

  return response;
}