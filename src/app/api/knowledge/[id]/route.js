export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_, context) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
        const { id } = await context.params
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    
        const { data:source , error:fetchError } = await supabase
            .from("knowledge_sources")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single()
    
        if (fetchError || !source) {
          return NextResponse.json(
            { error: "Knowledge source not found" },
            { status: 404 }
          )
        }
    
        const { error:sourceDeleteError } = await supabase
            .from("knowledge_sources")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)
    
        if (sourceDeleteError) {
            console.error(sourceDeleteError);
            return NextResponse.json(
                { error: "Failed to delete knowledge source" },
                { status: 500 }
            )
        }
    
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete source error ", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}