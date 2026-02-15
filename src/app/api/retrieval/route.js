import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/embedding";

export async function POST(request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agent_id, query } = await request.json();

  if (!agent_id || !query) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const embedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc("search_knowledge_chunks", {
    query_embedding: embedding,
    match_agent_id: agent_id,
    match_limit: 5,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data });
}
