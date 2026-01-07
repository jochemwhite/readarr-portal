import { NextRequest, NextResponse } from "next/server";
import { getBookFiles } from "@/lib/readarr";
import { ReadarrAPIError } from "@/lib/readarr";
import { createReadStream, existsSync, statSync } from "fs";
import { basename } from "path";

const BOOKS_PATH = process.env.BOOKS_PATH || "/books";

// MIME types for common book formats
const MIME_TYPES: Record<string, string> = {
  ".epub": "application/epub+zip",
  ".pdf": "application/pdf",
  ".mobi": "application/x-mobipocket-ebook",
  ".azw": "application/vnd.amazon.ebook",
  ".azw3": "application/vnd.amazon.ebook",
  ".txt": "text/plain",
  ".html": "text/html",
  ".htm": "text/html",
};

function getMimeType(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function translatePath(readarrPath: string): string {
  // Readarr might return paths like /data/books/... or /books/...
  // We need to translate to the mounted volume path
  // Common patterns: /data/books, /books, /media/books
  const pathPrefixes = ["/data/books", "/data", "/books", "/media/books", "/media"];
  
  let translatedPath = readarrPath;
  for (const prefix of pathPrefixes) {
    if (readarrPath.startsWith(prefix)) {
      translatedPath = readarrPath.replace(prefix, BOOKS_PATH);
      break;
    }
  }
  
  return translatedPath;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId: bookIdParam } = await params;
    const bookId = parseInt(bookIdParam);
    
    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: "Invalid book ID" },
        { status: 400 }
      );
    }

    // Get book files from Readarr
    const bookFiles = await getBookFiles(bookId);

    if (!bookFiles || bookFiles.length === 0) {
      return NextResponse.json(
        { error: "No files found for this book" },
        { status: 404 }
      );
    }

    // Get the first file (most common case)
    const bookFile = bookFiles[0];
    const readarrPath = bookFile.path;
    const filePath = translatePath(readarrPath);

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath} (original: ${readarrPath})`);
      return NextResponse.json(
        { error: "File not found on server", path: readarrPath },
        { status: 404 }
      );
    }

    // Get file stats
    const stats = statSync(filePath);
    const fileName = basename(filePath);
    const mimeType = getMimeType(fileName);

    // Create read stream
    const stream = createReadStream(filePath);
    
    // Convert Node stream to Web stream
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: string | Buffer) => {
          const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
          controller.enqueue(new Uint8Array(buffer));
        });
        stream.on("end", () => {
          controller.close();
        });
        stream.on("error", (error) => {
          controller.error(error);
        });
      },
      cancel() {
        stream.destroy();
      },
    });

    // Return the file as a stream
    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Content-Length": stats.size.toString(),
      },
    });
  } catch (error) {
    if (error instanceof ReadarrAPIError) {
      return NextResponse.json(
        { error: error.message, status: error.status },
        { status: error.status || 500 }
      );
    }
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during download" },
      { status: 500 }
    );
  }
}
