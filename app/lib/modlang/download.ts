import JSZip from "jszip";
import { APP_AUTHOR, APP_NAME } from "./constants";

type DownloadArtifact = {
  finalName: string;
  blob: Blob;
};

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildTranslationSummary(params: {
  summaryLines: string[];
  totalProcessed: number;
  successCount: number;
}) {
  const { summaryLines, totalProcessed, successCount } = params;

  return [
    `${APP_NAME}`,
    `Autor: ${APP_AUTHOR}`,
    `Fecha: ${new Date().toLocaleString()}`,
    "",
    "Resumen de traducción",
    "=====================",
    ...summaryLines,
    "",
    `Total procesados en esta ejecución: ${totalProcessed}`,
    `Total incluidos exitosamente: ${successCount}`,
    `Total con error: ${
      summaryLines.filter((line) => line.startsWith("[ERROR]")).length
    }`,
    `Total omitidos: ${
      summaryLines.filter((line) => line.startsWith("[OMITIDO]")).length
    }`,
  ].join("\n");
}

export async function downloadSingleArtifact(artifact: DownloadArtifact) {
  downloadBlob(artifact.blob, artifact.finalName);
  return artifact.finalName;
}

export async function downloadArtifactsZip(params: {
  artifacts: DownloadArtifact[];
  summaryText: string;
}) {
  const { artifacts, summaryText } = params;

  const zipFinal = new JSZip();

  for (const artifact of artifacts) {
    zipFinal.file(artifact.finalName, artifact.blob);
  }

  zipFinal.file("resumen_traduccion.txt", summaryText);

  const zipBlob = await zipFinal.generateAsync({
    type: "blob",
    compression: "DEFLATE",
  });

  const finalZipName = `mods_traducidos_${Date.now()}.zip`;
  downloadBlob(zipBlob, finalZipName);

  return finalZipName;
}