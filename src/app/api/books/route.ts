import { NextResponse } from "next/server";
import { getBooks } from "@/lib/readarr";
import { ReadarrAPIError } from "@/lib/readarr";

export async function GET() {
  try {
    const books = await getBooks();
    return NextResponse.json(books);
  } catch (error) {
    if (error instanceof ReadarrAPIError) {
      return NextResponse.json(
        { error: error.message, status: error.status },
        { status: error.status || 500 }
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
