import { Author } from "@/types/readarr";

const READARR_API_URL = process.env.READARR_API_URL || "http://10.10.10.105:8787";
const READARR_API_KEY = process.env.READARR_API_KEY || "";

/**
 * Search for an author by name
 */
export async function searchAuthor(authorName: string): Promise<Author[]> {
  const url = `${READARR_API_URL}/api/v1/author/lookup?term=${encodeURIComponent(authorName)}`;
  
  const response = await fetch(url, {
    headers: {
      "X-Api-Key": READARR_API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to search for author: ${response.statusText}`);
  }

  return await response.json();
}
