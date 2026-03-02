import { NextResponse } from "next/server";
import { queryRAG } from "@/lib/rag";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
     
    const { agentId, conversationId, query } = await request.json()
    if (!agentId || !conversationId || !query) {
        console.log("Missing agentId or conversationId or query", { agentId, conversationId, query })
        return NextResponse.json({ error: "Missing agentId or conversationId or query" } , { status: 400 })
    }

    const response = await queryRAG(agentId, conversationId, query)
    console.log("RAG Response:", response)

    return NextResponse.json({ response })
}