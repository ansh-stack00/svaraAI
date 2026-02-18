import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_ , context) {
    try {
        const supabase = await createClient()
    
        const {data : { user } , error : authError } = await supabase.auth.getUser()
        if(authError || !user){
            console.log("Unauthorized access" , authError)
            return NextResponse.json({ error: "Unauthorized" } , { status: 401 })
        }
    
        const { id } = await context.params
        console.log("id" , id)
        if(!id){
            console.log("Missing call id" , id)
            return NextResponse.json({ error: "Missing call id" } , { status: 400 })
        }
    
        // fetching calls
       const { data:call , error:callError } = await supabase 
            .from("calls")
            .select(`*,
        agents (
          name
        )`)
            .eq("id" , id)
            .eq("user_id" , user.id)
            .single()
        console.log(call)
        
        if(callError) {
            console.log("Call not found" , callError)
            return NextResponse.json({ error: "Call not found" } , { status: 404 })
    
        }
    
        // fetching transcript
    
        const {data:transcript , error:transcriptError } = await supabase
            .from("transcripts")
            .select('*')
            .eq("call_id" , id)
            .eq("user_id" , user.id)
            .order("created_at" , { ascending: false })

        console.log(transcript[0])
    
        if(transcriptError) {
            console.log("Transcript not found" , transcriptError)
            return NextResponse.json({ error: "Transcript not found" } , { status: 404 })
        }
    
        const agentName = call.agents?.name
        const startedAt = new Date(call.started_at);
        const endedAt = call.ended_at ? new Date(call.ended_at) : null;

        const callDate = startedAt.toLocaleString();

        let duration = "N/A";
        if (endedAt) {
          const diffMs = endedAt.getTime() - startedAt.getTime();
          const seconds = Math.floor(diffMs / 1000);
          duration = `${seconds}s`;
        }
    
        let txtContent = `Call Transcript\n`;
        txtContent += `================\n\n`;
        txtContent += `Agent: ${agentName}\n`;
        txtContent += `Date: ${callDate}\n`;
        txtContent += `Duration: ${duration}\n`;
        txtContent += `Status: ${call.status}\n\n`;
        txtContent += `Conversation:\n`;
        txtContent += `\n\n`;
    
        if (transcript && transcript.length > 0) {
          transcript.forEach((t) => {
            const speaker = t.speaker === 'user' ? 'You' : agentName;
            const time = new Date(t.created_at).toLocaleTimeString();
            txtContent += `[${time}] ${speaker}: ${t.text}\n\n`;
          });
        } else {
          txtContent += `No transcript available.\n`;
        }

        console.log(txtContent)
    
        if(!txtContent) {
            console.log("Transcript not found" , txtContent)
            return NextResponse.json({ error: "Transcript not found" } , { status: 404 })
        }
        
        return new Response(txtContent, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="transcript-${id}.txt"`,
          },
        });
    } catch (error) {
        console.log('Error in GET /api/calls/[id]/export/txt:', error)
        return NextResponse.json({ error: "Internal Server Error" } , { status: 500 })
    }


}