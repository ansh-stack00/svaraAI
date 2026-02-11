"use client";

import { useState } from "react"
import supabase from "@/lib/supabaseClient"
import Link from "next/link"
import { Button } from "@/components/ui/button";


export default function Signup() {
    // const [email, setEmail] = useState("")
    // const [password, setPassword] = useState("")

    // const handleSignup = async (e) => {
    //     e.preventDefault()

    //     const { error } = await supabase.auth.Signup({
    //         email,
    //         password,
    //     })

    //     if ( error ) alert(error.message);
    //     else {
    //         alert("Check your email for confirmation!")
    //         router.push("/login")
    //     }
    // }


     return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              {/* <Mic className="w-7 h-7 text-white" /> */}
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gradient mb-2">VoiceAgent Platform</h1>
          <p className="text-gray-600">Create your account to get started</p>
          
        </div>
        
        {/* <RegisterForm /> */}
      </div>
    </div>
  );


}