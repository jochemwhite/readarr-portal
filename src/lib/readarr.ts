import {
  ReadarrBook,
  QualityProfile,
  RootFolder,
  BookFile,
  SystemStatus,
  BookAddPayload,
} from "@/types/readarr";

const READARR_API_URL = process.env.READARR_API_URL || "http://10.10.10.105:8787";
const READARR_API_KEY = process.env.READARR_API_KEY || "";

class ReadarrAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string
  ) {
    super(message);
    this.name = "ReadarrAPIError";
  }
}

async function readarrFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${READARR_API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "X-Api-Key": READARR_API_KEY,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `Readarr API error: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        console.error("Readarr API error response:", errorBody);
        if (errorBody.message) {
          errorMessage = errorBody.message;
        } else if (typeof errorBody === 'string') {
          errorMessage = errorBody;
        }
      } catch (e) {
        // Response body is not JSON, use status text
        console.error("Could not parse error response");
      }
      
      throw new ReadarrAPIError(
        errorMessage,
        response.status,
        response.statusText
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ReadarrAPIError) {
      throw error;
    }
    console.error("Readarr fetch error:", error);
    throw new ReadarrAPIError(
      `Failed to connect to Readarr: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function searchBooks(query: string): Promise<ReadarrBook[]> {
  return readarrFetch<ReadarrBook[]>(`/api/v1/book/lookup?term=${encodeURIComponent(query)}`);
}

export async function getBooks(): Promise<ReadarrBook[]> {
  return readarrFetch<ReadarrBook[]>("/api/v1/book");
}

export async function getBook(id: number): Promise<ReadarrBook> {
  return readarrFetch<ReadarrBook>(`/api/v1/book/${id}`);
}

export async function addBook(book: BookAddPayload): Promise<ReadarrBook> {
  return readarrFetch<ReadarrBook>("/api/v1/book", {
    method: "POST",
    body: JSON.stringify(book),
  });
}

export async function getQualityProfiles(): Promise<QualityProfile[]> {
  return readarrFetch<QualityProfile[]>("/api/v1/qualityprofile");
}

export async function getRootFolders(): Promise<RootFolder[]> {
  return readarrFetch<RootFolder[]>("/api/v1/rootfolder");
}

export async function getBookFiles(bookId: number): Promise<BookFile[]> {
  return readarrFetch<BookFile[]>(`/api/v1/bookfile?bookId=${bookId}`);
}

export async function searchBookCommand(bookId: number): Promise<void> {
  await readarrFetch("/api/v1/command", {
    method: "POST",
    body: JSON.stringify({
      name: "BookSearch",
      bookIds: [bookId],
    }),
  });
}

export async function getSystemStatus(): Promise<SystemStatus> {
  return readarrFetch<SystemStatus>("/api/v1/system/status");
}

export { ReadarrAPIError };
