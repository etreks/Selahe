import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// Identity colors assigned at creation (cycle through palette).
const PALETTE = ["#3B82F6", "#F97316", "#10B981", "#8B5CF6", "#EF4444", "#F59E0B"];

// POST /api/actions — create a new action (no title until first card commit)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Pick the next palette color based on existing action count.
  const { count } = await supabase
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const color = PALETTE[(count ?? 0) % PALETTE.length];

  const { data, error } = await supabase
    .from("actions")
    .insert({ user_id: user.id, color })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ action: data });
}

// GET /api/actions — list this user's non-archived actions
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("actions")
    .select("*")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ actions: data });
}
