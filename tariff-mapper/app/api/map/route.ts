import { NextRequest, NextResponse } from "next/server";
import { mapTariffCodes } from "@/lib/openai";
import {
  getCachedMapping,
  setCachedMapping,
  logSearchHistory,
} from "@/lib/supabase";
import { MappingDirection, SearchMode } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, direction, searchMode } = body as {
      query: string;
      direction: MappingDirection;
      searchMode: SearchMode;
    };

    if (!query || !direction || !searchMode) {
      return NextResponse.json(
        { error: "Missing required fields: query, direction, searchMode" },
        { status: 400 }
      );
    }

    if (query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = await getCachedMapping(query, direction);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Call OpenAI mapping
    const result = await mapTariffCodes(query, direction, searchMode);

    // Cache result and log history (fire-and-forget)
    setCachedMapping(query, direction, result);
    logSearchHistory({
      query,
      direction,
      search_mode: searchMode,
      hs_anchor: result.hsAnchor,
      result_count: result.matches.length,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Mapping API error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message.includes("API key")) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
