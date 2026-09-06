export interface ScanResultData {
  success: boolean;
  error?: string;
  status?: string;
  ticket?: {
    code: string;
    status: string;
    checkedInAt?: string | null;
  };
  event?: {
    title: string;
  };
}
