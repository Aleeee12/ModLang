export type AnalysisResult = {
  sourcePath: string | null;
  targetPath: string | null;
  sourceLines: number;
  targetLines: number;
  sourceLangFile: string;
  targetLangFile: string;
  message: string;
};

export type AnalyzeJarReturn = {
  result: AnalysisResult;
  parsedSource: Record<string, string> | null;
  parsedTarget: Record<string, string> | null;
  showContinue: boolean;
  modId: string | null;
};

export type QueueStatus =
  | "pendiente"
  | "analizando"
  | "traduciendo"
  | "empaquetando"
  | "ok"
  | "error"
  | "omitido";

export type OutputFormat = "jar" | "resourcepack";

export type QueueItem = {
  id: string;
  file: File;
  fileName: string;
  status: QueueStatus;
  message: string;
  progress: number;
  entriesTotal: number;
  entriesDone: number;
  outputName?: string;
  outputFormat?: OutputFormat;
  modId?: string;
};

export type BuiltArtifact = {
  itemId: string;
  sourceFileName: string;
  finalName: string;
  blob: Blob;
};