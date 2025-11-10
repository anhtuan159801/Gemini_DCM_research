export interface AnalysisResult {
  fullReport: string;
}

export type DocumentStatus = 'pending' | 'parsing' | 'ocr' | 'queued' | 'analyzing' | 'success' | 'error';

export interface AnalyzedDocument {
  id: string;
  file: File;
  text: string | null;
  status: DocumentStatus;
  result: AnalysisResult | null;
  error: string | null;
  progress?: number; // For OCR progress
}

export interface MatrixColumn {
  id: string;
  header: string;
  prompt: string;
  enabled: boolean;
}
