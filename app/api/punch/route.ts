import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { todayISO, formatLogDate } from "@/lib/dates";

// POST /api/punch
// Records a completion for the active card version of an action.
// scheduled_date is computed HERE, server-side — never by the model.
// This is the fix for the "wrong weekday" bug.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { action_id, scheduled_date } = await req.json();

  // Ownership.
  const { data: action } = await supabase
    .from("actions")
    .select("*")
    .eq("id", action_id)
    .eq("user_id", user.id)
    .single();
  if (!action) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Active version is the one this punch references (frozen forever).
  const { data: version } = await supabase
    .from("card_versions")
    .select("*")
    .eq("action_id", action_id)
    .eq("is_active", true)
    .maybeSingle();
  if (!version)
    return NextResponse.json({ error: "no active version" }, { status: 400 });

  // The calendar day this punch counts for. Default = today, computed in code.
  const dateForPunch = scheduled_date || todayISO();

  const { data: punch, error } = await supabase
    .from("punches")
    .insert({
      action_id,
      card_version_id: version.id,
      scheduled_date: dateForPunch,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-log message — weekday computed correctly by formatLogDate, not the AI.
  await supabase.from("messages").insert({
    action_id,
    role: "system",
    content: `Done task on ${formatLogDate(dateForPunch)}`,
    message_type: "auto_log",
    punch_id: punch.id,
  });

  return NextResponse.json({ punch });
}

// DELETE /api/punch — un-punch (toggle off) for a given date
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const punch_id = searchParams.get("punch_id");
  if (!punch_id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  // Ownership via join to actions.
  const { data: punch } = await supabase
    .from("punches")
    .select("*, action:actions!inner(user_id)")
    .eq("id", punch_id)
    .single();

  if (!punch || (punch as any).action.user_id !== user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await supabase.from("punches").delete().eq("id", punch_id);
  return NextResponse.json({ ok: true });
}