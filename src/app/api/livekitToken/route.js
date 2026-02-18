import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(request) {
   try {
     const supabase = await createClient()
     const { data : { user } } = await supabase.auth.getUser()
 
     if(!user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }
 
     const { room_name , participant_name } = await request.json()
 
     if(!room_name || !participant_name) {
         return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
     }
 
     const token = new AccessToken(
         process.env.LIVEKIT_API_KEY,
         process.env.LIVEKIT_API_SECRET,
         { identity: participant_name }
     )
 
     if(!token) {
         return NextResponse.json({ error: "Failed to generate token" }, { status: 500 })
     }
 
     token.addGrant({
         roomJoin:true,
         room: room_name,
         canPublish: true,
         canSubscribe: true,
         canPublishData: true
     })
 
     const jwt = await token.toJwt()
     return NextResponse.json({ 
         token: jwt , 
         ws_url: process.env.LIVEKIT_URL 
     })
   } catch (error) {
     console.log(error)
     return NextResponse.json({ error: error.message || "Failed to generate token" }, { status: 500 })
   }
    
}