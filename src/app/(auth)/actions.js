"use server";
import { supabase } from "@/lib/supabaseClient";
import { redirect } from "next/navigation"


export async function login(formdata) {
    const email = formdata.get("email")
    const password = formdata.get("password")

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        console.error("Login error:", error.message);
        return { error: error.message };
    }

    redirect("/dashboard")
}


export async function register(formdata) {

    const email = formdata.get("email")
    const password = formdata.get("password")

    const { error } = await supabase.auth.signUp({
        email,
        password
    })

     if (error) {
        console.error("Registration error:", error.message);
        return { error: error.message };
    }

    redirect("/login");
}

export async function logout() {
  await supabase.auth.signOut();
  redirect("/login");
}