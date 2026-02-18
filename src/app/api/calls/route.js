import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


// api to create a new call 
export async function POST(request) {
    try {
        const supabase = await createClient()
    
        const {data : { user } } = await supabase.auth.getUser()
        if(!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
        const { agent_id } = await request.json()
        if(!agent_id) {
            console.log("Missing agent id" , agent_id)
            return NextResponse.json({ error: "Missing agent id" }, { status: 400 })
        }
    
        const { data: call } = await supabase
            .from("calls")
            .insert({
                user_id: user.id,
                agent_id,
                status: "in_progress",
            })
            .select(`
                    *,
                    agent:agents(*)
                `)
            .single()
    
        if(!call) {
            console.log("Failed to create call" , call)
            return NextResponse.json({ error: "Failed to create call" }, { status: 500 })
        }
    
        return NextResponse.json({
            call_id:call.id,
            room_name:`call-${call.id}`,
            agent:call.agent,
            user_id:user.id
        })
    } catch (error) {
        console.log('Error starting call ' , error)
        return NextResponse.json({ error: error.message || "Failed to start call" }, { status: 500 })
    }

}

// api to update progress of a call 
export async function PUT(request) {
    try {
        const supabase = await createClient()
        const{ data : { user } } = await supabase.auth.getUser()
    
        if(!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
        const { call_id } = await request.json()
        if(!call_id) {
            console.log("Missing call id" , call_id)
            return NextResponse.json({ error: "Missing call id" }, { status: 400 })
        }
    
        const { error : updateError } = await supabase
         .from("calls")
         .update({ 
                status: "completed" ,
                ended_at: new Date().toISOString()
            })
         .eq("id" , call_id)
         .eq("user_id" , user.id)
        
        if(updateError) {
            console.log("Failed to update call" , updateError)
            return NextResponse.json({ error: "Failed to end call" }, { status: 500 })
        }
    
        return NextResponse.json({ success: true })
    } catch (error) {
        console.log('Error ending call ' , error)
        return NextResponse.json({ error: error.message || "Failed to end call" }, { status: 500 })
    }
}


