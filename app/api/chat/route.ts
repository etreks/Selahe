import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { groq, MODEL, SYSTEM_PROMPT } from "@/lib/groq";
import type { ProposedCard } from "@/lib/types";

// Pull a ```json ... ``` block out of the model's reply, if present.
function extractCardJSON(text: string): ProposedCard | null {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (parsed && parsed.type === "propose_card" && parsed.title) {
      return parsed as ProposedCard;
    }
  } catch {
    return null;
  }
  return null;
}

// The dialogue text with the JSON block stripped out, for display.
function stripCardJSON(text: string): string {
  return text.replace(/```json[\s\S]*?```/, "").trim();
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { action_id, message } = await req.json();
  if (!action_id || !message) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // Confirm the action belongs to this user.
  const { data: action } = await supabase
    .from("actions")
    .select("*")
    .eq("id", action_id)
    .eq("user_id", user.id)
    .single();
  if (!action) {
    return NextResponse.json({ error: "action not found" }, { status: 404 });
  }

  // Persist the user's message.
  await supabase.from("messages").insert({
    action_id,
    role: "user",
    content: message,
    message_type: "dialogue",
  });

  // Load thread history for context.
  const { data: history } = await supabase
    .from("messages")
    .select("role, content, message_type")
    .eq("action_id", action_id)
    .order("created_at", { ascending: true });

  const chatMessages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...(history ?? [])
      .filter((m) => m.message_type === "dialogue")
      .map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
  ];

  // Call Groq. One retry if a JSON block is present but malformed.
  let reply = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: chatMessages,
      temperature: 0.6,
      max_tokens: 700,
    });
    reply = completion.choices[0]?.message?.content ?? "";
    const looksLikeCard = reply.includes("```json");
    if (!looksLikeCard || extractCardJSON(reply)) break;
    // malformed JSON -> nudge and retry once
    chatMessages.push({ role: "assistant", content: reply });
    chatMessages.push({
      role: "user",
      content:
        "That JSON was malformed. Resend ONLY a valid propose_card JSON block, nothing else.",
    });
  }

  const proposed = extractCardJSON(reply);
  const dialogue = stripCardJSON(reply) || "Got it.";

  // Persist the assistant dialogue.
  await supabase.from("messages").insert({
    action_id,
    role: "assistant",
    content: dialogue,
    message_type: "dialogue",
  });

  return NextResponse.json({ dialogue, proposed });
}
