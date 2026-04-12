import {
  createTranslationJob,
  decodeUploadedSourcesFromFormData,
  runTranslationJob,
} from "../../../lib/translateJobs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const { sources, target, sourceLang } =
      await decodeUploadedSourcesFromFormData(form);

    if (sources.length === 0) {
      return Response.json(
        { ok: false, error: "No se recibió ningún archivo." },
        { status: 400 }
      );
    }

    const job = createTranslationJob({
      sources,
      target,
      sourceLang,
    });

    void runTranslationJob(job.id);

    return Response.json({
      ok: true,
      jobId: job.id,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo iniciar.",
      },
      { status: 500 }
    );
  }
}