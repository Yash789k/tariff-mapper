import OpenAI from "openai";
import { MappingDirection, MappingResponse, SearchMode } from "./types";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "API key not configured. Please add OPENAI_API_KEY to your .env.local file."
    );
  }
  return new OpenAI({ apiKey });
}

export async function mapTariffCodes(
  query: string,
  direction: MappingDirection,
  searchMode: SearchMode
): Promise<MappingResponse> {
  const openai = getClient();

  // Direction is now baked into the system prompt so the model
  // cannot confuse which country's national codes to return.
  const systemPrompt = buildSystemPrompt(direction);
  const userPrompt = buildUserPrompt(query, direction, searchMode);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 3000,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI model");
  }

  const parsed = JSON.parse(content);

  return {
    query,
    direction,
    hsAnchor: parsed.hsAnchor ?? "N/A",
    hsAnchorDescription: parsed.hsAnchorDescription ?? "",
    matches: parsed.matches ?? [],
    processingNote: parsed.processingNote ?? "",
    cached: false,
  };
}
