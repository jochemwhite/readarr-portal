import { ReadarrBook } from "@/types/readarr";

/**
 * Get book cover URL with multiple fallback sources
 * Priority: Readarr → Open Library → Google Books → Placeholder
 */
export function getBookCoverUrl(book: ReadarrBook): string {
  // Try Readarr's remote cover first
  if (book.remoteCover) {
    return book.remoteCover;
  }

  // Try Readarr's images
  const readarrCover = book.images?.find((img) => img.coverType === "cover");
  if (readarrCover?.remoteUrl) {
    return readarrCover.remoteUrl;
  }
  if (readarrCover?.url && !readarrCover.url.startsWith("/")) {
    return readarrCover.url;
  }

  // Try to get ISBN from editions
  const isbn = getBookISBN(book);
  if (isbn) {
    // Return Open Library cover URL
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }

  // Try using book title and author for Open Library search
  const title = encodeURIComponent(book.title);
  const author = encodeURIComponent(
    book.author?.authorName || book.authorTitle || ""
  );
  
  // Note: This is a constructed URL, Open Library will handle it
  // We could also use the OLID (Open Library ID) if available
  if (book.editions?.[0]?.foreignEditionId) {
    const olid = extractOpenLibraryId(book.editions[0].foreignEditionId);
    if (olid) {
      return `https://covers.openlibrary.org/b/olid/${olid}-L.jpg`;
    }
  }

  // Fallback to placeholder
  return "/placeholder-book.svg";
}

/**
 * Extract ISBN from book editions
 */
export function getBookISBN(book: ReadarrBook): string | null {
  if (!book.editions || book.editions.length === 0) {
    return null;
  }

  // Try to get ISBN13 first (more common)
  for (const edition of book.editions) {
    if (edition.isbn13) {
      return edition.isbn13;
    }
  }

  // Try ASIN (Amazon)
  for (const edition of book.editions) {
    if (edition.asin) {
      return edition.asin;
    }
  }

  return null;
}

/**
 * Extract Open Library ID from foreign edition ID
 */
export function extractOpenLibraryId(foreignEditionId: string): string | null {
  // Foreign IDs can be like "OL123456M" or full URLs
  if (foreignEditionId.startsWith("OL") && foreignEditionId.includes("M")) {
    return foreignEditionId;
  }

  // Try to extract from URL
  const match = foreignEditionId.match(/OL\d+M/);
  return match ? match[0] : null;
}

/**
 * Get multiple cover source URLs for fallback chain
 */
export function getBookCoverSources(book: ReadarrBook): string[] {
  const sources: string[] = [];

  // Readarr remote cover
  if (book.remoteCover) {
    sources.push(book.remoteCover);
  }

  // Readarr images
  const readarrCover = book.images?.find((img) => img.coverType === "cover");
  if (readarrCover?.remoteUrl) {
    sources.push(readarrCover.remoteUrl);
  }

  // ISBN-based covers
  const isbn = getBookISBN(book);
  if (isbn) {
    sources.push(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`);
  }

  // Open Library ID based covers
  if (book.editions?.[0]?.foreignEditionId) {
    const olid = extractOpenLibraryId(book.editions[0].foreignEditionId);
    if (olid) {
      sources.push(`https://covers.openlibrary.org/b/olid/${olid}-L.jpg`);
    }
  }

  // Google Books API (requires additional fetch, so we'll skip for now)
  // Could be added later if needed

  // Always have placeholder as final fallback
  sources.push("/placeholder-book.svg");

  return sources;
}
