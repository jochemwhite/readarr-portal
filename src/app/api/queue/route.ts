import { NextResponse } from "next/server";
import { getQueue } from "@/lib/readarr-queue";

export async function GET() {
  try {
    const queue = await getQueue();
    return NextResponse.json(queue);
  } catch (error) {
    console.error("Queue API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch download queue" },
      { status: 500 }
    );
  }
}
