import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/readarr";
import { ReadarrAPIError } from "@/lib/readarr";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const books = await searchBooks(query);
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
