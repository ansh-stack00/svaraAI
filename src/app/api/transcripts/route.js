import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function POST(request) {
    try {

        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log("Unauthorized access")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { call_id , speaker , text } = await request.json()
       
        if(
            [call_id , speaker , text].some((field) => field.trim() === "")
        ){
            console.log("Missing required fields")
            return NextResponse.json({ error: "All field are required " }, { status: 400 })
        }

        const { data : call , error:callError } = await supabase
            .from("calls")
            .select("id")
            .eq("id" , call_id)
            .eq("user_id" , user.id)
            .single()
        
        if(callError || !call) {
            console.log("Call not found")
            return NextResponse.json({ error: "Call not found" }, { status: 404 })
        }

        const { data : transcript , error:transcriptError } = await supabase
            .from("transcripts")
            .insert({ call_id , speaker , text , timestamp: new Date().toISOString(), })
            .select()
            .single()
        
        if(transcriptError || !transcript) {
            console.log("Failed to store transcript")
            return NextResponse.json({ error: "Failed to store transcript" }, { status: 500 })
        }

        return NextResponse.json({transcript})

    } catch (error) {
        console.log("Error in POST /api/transcripts:" , error)
        return NextResponse.json({ error: error.message || "Failed to store transcript" }, { status: 500 })
        
    }
}