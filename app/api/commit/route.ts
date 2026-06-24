import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { formatDuration } from "@/lib/dates";
import type { ProposedCard } from "@/lib/types";

// POST /api/commit
// Saves a proposed card. If the action already has an active version,
// supersede it (renegotiation). Otherwise it's the first commit.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { action_id, card } = (await req.json()) as {
    action_id: string;
    card: ProposedCard;
  };

  // Ownership check.
  const { data: action } = await supabase
    .from("actions")
    .select("*")
    .eq("id", action_id)
    .eq("user_id", user.id)
    .single();
  if (!action) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Find an existing active version (renegotiation case).
  const { data: existing } = await supabase
    .from("card_versions")
    .select("*")
    .eq("action_id", action_id)
    .eq("is_active", true)
    .maybeSingle();

  // Deactivate the old one first (DB enforces only one active per action).
  if (existing) {
    await supabase
      .from("card_versions")
      .update({ is_active: false })
      .eq("id", existing.id);
  }

  // Insert the new active version.
  const { data: newVersion, error } = await supabase
    .from("card_versions")
    .insert({
      action_id,
      start_time: card.start_time,
      end_time: card.end_time,
      location: card.location,
      duration_minutes: card.duration_minutes,
      days_of_week: card.days_of_week ?? [],
      why_text: card.why_text,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Point the old version at the new one.
  if (existing) {
    await supabase
      .from("card_versions")
      .update({ superseded_by_id: newVersion.id })
      .eq("id", existing.id);
  }

  // First commit locks in the action title.
  if (!action.title) {
    await supabase
      .from("actions")
      .update({ title: card.title })
      .eq("id", action_id);
  }

  // Append the appropriate system message to the thread.
  if (existing) {
    const before = formatDuration(existing.duration_minutes);
    const after = formatDuration(card.duration_minutes);
    await supabase.from("messages").insert({
      action_id,
      role: "system",
      content: `Updated ${card.title}: ${before} → ${after}.`,
      message_type: "card_updated",
      card_version_id: newVersion.id,
    });
  } else {
    await supabase.from("messages").insert({
      action_id,
      role: "system",
      content: "Saved in 'Action Logbook'",
      message_type: "saved_notification",
      card_version_id: newVersion.id,
    });
  }

  return NextResponse.json({ version: newVersion });
}
