import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/dist/server/api-utils";
import { DashboardNav } from "@/components/dashboard/dashboardNav";


export default async function DashboardLayout({ children }) {

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if(!user) redirect("/login")
    
    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <DashboardNav user={user} />
      <main className="max-w-7xl mx-auto px-8 py-8">
        {children}
      </main>
    </div>
  )
}