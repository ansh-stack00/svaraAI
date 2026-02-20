import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request , context) {

    try {

        const supabase = await createClient()
        const { data : { user } , error : authError } = await supabase.auth.getUser()

        if(authError || !user) {
            console.log("Unauthorized access" , authError)
            return NextResponse.json({ error: "Unauthorized" } , { status: 401 })
        }

        const { id } = await context.params
        if(!id) {
            console.log("Missing call id" , id)
            return NextResponse.json({ error: "Missing call id" } , { status: 400 })
        }


        const { data:call , error:callError } = await supabase 
            .from("calls")
            .select('*,agents(name)')
            .eq("id" , id)
            .eq("user_id" , user.id)
            .single()

        if(callError || !call) {
            console.log("Call not found" , callError)
            return NextResponse.json({ error: "Call not found" } , { status: 404 })
        }

        const { data : transcripts , error : transcriptError } = await supabase
        .from("transcripts")
        .select("*")
        .eq("call_id" , id)
        .eq("user_id" , user.id)
        .order("created_at" , { ascending: false })

        if(transcriptError) {
            console.log("Failed to fetch transcripts" , transcriptError)
            return NextResponse.json({ error: "Failed to fetch transcripts" } , { status: 500 })
        }

        return NextResponse.json({ call , transcripts })


        
    } catch (error) {
        console.log("Error fetching transcript" , error )
        return NextResponse.json({ error: "Error fetching transcript" } , { status: 500 })
    }
}