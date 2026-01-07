const READARR_API_URL = process.env.READARR_API_URL || "http://10.10.10.105:8787";
const READARR_API_KEY = process.env.READARR_API_KEY || "";

export interface QueueItem {
  id: number;
  bookId: number;
  book?: {
    id: number;
    title: string;
    authorTitle?: string;
  };
  title: string;
  sizeleft: number;
  size: number;
  status: string;
  trackedDownloadStatus: string;
  trackedDownloadState: string;
  statusMessages: any[];
  downloadId: string;
  protocol: string;
  downloadClient: string;
  outputPath: string;
  estimatedCompletionTime?: string;
  timeleft?: string;
}

export interface QueueResponse {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDirection: string;
  totalRecords: number;
  records: QueueItem[];
}

/**
 * Get the download queue from Readarr
 */
export async function getQueue(): Promise<QueueResponse> {
  const url = `${READARR_API_URL}/api/v1/queue?includeBook=true`;
  
  const response = await fetch(url, {
    headers: {
      "X-Api-Key": READARR_API_KEY,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch queue: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Check if a book is currently in the download queue
 */
export async function isBookDownloading(bookId: number): Promise<boolean> {
  try {
    const queue = await getQueue();
    return queue.records.some((item) => item.bookId === bookId);
  } catch (error) {
    console.error("Failed to check if book is downloading:", error);
    return false;
  }
}
