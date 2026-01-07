import { NextRequest, NextResponse } from "next/server";

const READARR_API_URL = process.env.READARR_API_URL || "http://10.10.10.105:8787";
const READARR_API_KEY = process.env.READARR_API_KEY || "";

/**
 * Trigger a search for multiple books
 */
export async function POST(request: NextRequest) {
  try {
    const { bookIds } = await request.json();

    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json(
        { error: "bookIds array is required" },
        { status: 400 }
      );
    }

    const url = `${READARR_API_URL}/api/v1/command`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Api-Key": READARR_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "BookSearch",
        bookIds: bookIds,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger search: ${response.statusText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Search command error:", error);
    return NextResponse.json(
      { error: "Failed to trigger book search" },
      { status: 500 }
    );
  }
}
