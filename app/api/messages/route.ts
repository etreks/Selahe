import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET /api/messages?action_id=...
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action_id = searchParams.get("action_id");
  if (!action_id)
    return NextResponse.json({ error: "missing action_id" }, { status: 400 });

  // Ownership.
  const { data: action } = await supabase
    .from("actions")
    .select("id")
    .eq("id", action_id)
    .eq("user_id", user.id)
    .single();
  if (!action) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("action_id", action_id)
    .order("created_at", { ascending: true });

  // Also fetch the card versions referenced, so the UI can render embedded cards.
  const { data: versions } = await supabase
    .from("card_versions")
    .select("*")
    .eq("action_id", action_id);

  const { data: actionFull } = await supabase
    .from("actions")
    .select("*")
    .eq("id", action_id)
    .single();

  return NextResponse.json({
    messages: messages ?? [],
    versions: versions ?? [],
    action: actionFull,
  });
}
