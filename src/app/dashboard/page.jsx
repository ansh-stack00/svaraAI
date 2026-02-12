import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Phone,
  Clock,
  TrendingUp,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch Agents
  const { data: agents = [], count: agentCount } = await supabase
    .from("agents")
    .select("*", { count: "exact" })
    .eq("user_id", user.id);

  // Fetch Calls
  const { data: calls = [], count: callCount } = await supabase
    .from("calls")
    .select("*", { count: "exact" })
    .eq("user_id", user.id);

  // Calculate stats
  const totalDuration = calls.reduce(
    (sum, call) => sum + (call.duration || 0),
    0
  );

  const avgDuration = callCount
    ? Math.floor(totalDuration / callCount)
    : 0;

  const successRate = callCount
    ? Math.floor(
        (calls.filter((c) => c.status === "completed").length /
          callCount) *
          100
      )
    : 0;

  // Recent Calls (fixed join + user filter)
  const { data: recentCalls = [] } = await supabase
    .from("calls")
    .select("*, agents(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-slate-400 text-lg">
              Monitor your voice agents and call performance
            </p>
          </div>

          {/* Fixed link */}
          <Link href="/dashboard/agents">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/50">
              <Plus className="w-5 h-5" />
              Create Agent
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

          <Link href="/dashboard/agents" className="cursor-pointer">
            <StatCard
              title="Total Agents"
              value={agentCount || 0}
              icon={Bot}
              trend="+12%"
              color="from-blue-500 to-blue-600"
            />
          </Link>

          <Link href="/dashboard/calls" className="cursor-pointer">
            <StatCard
              title="Total Calls"
              value={callCount || 0}
              icon={Phone}
              trend="+8%"
              color="from-cyan-500 to-cyan-600"
            />
          </Link>

          <Link href="/dashboard/calls" className="cursor-pointer">
            <StatCard
              title="Avg Duration"
              value={`${avgDuration}s`}
              icon={Clock}
              trend="+3%"
              color="from-teal-500 to-teal-600"
            />
          </Link>

          <Link href="/dashboard/analytics" className="cursor-pointer">
            <StatCard
              title="Success Rate"
              value={`${successRate}%`}
              icon={TrendingUp}
              trend="+5%"
              color="from-emerald-500 to-emerald-600"
            />
          </Link>

        </div>

        {/* Recent Calls */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="border-b border-slate-700 pb-6">
            <CardTitle className="text-2xl text-white">
              Recent Calls
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            {recentCalls.length > 0 ? (
              <div className="space-y-3">
                {recentCalls.map((call) => (
                  <Link
                    key={call.id}
                    href={`/dashboard/calls/${call.id}`}
                  >
                    <div className="flex justify-between items-center p-4 bg-slate-700/40 rounded-lg hover:bg-slate-700/60 transition-colors border border-slate-600/50 cursor-pointer">
                      <div className="flex-1">
                        <p className="font-semibold text-white text-base">
                          {call.agents?.name || "Unknown Agent"}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          {call.duration
                            ? `${call.duration}s`
                            : "In Progress"}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          call.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : call.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {call.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Phone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-lg">
                  No calls yet. Create an agent to get started!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }) {
  return (
    <Card className="border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm hover:from-slate-800 hover:to-slate-800/80 transition-all duration-300 shadow-xl hover:shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium text-slate-400 tracking-wide">
            {title}
          </CardTitle>
          <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="text-4xl font-bold text-white">
            {value}
          </div>

          {trend && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <ArrowUpRight className="w-4 h-4" />
              <span>{trend} from last month</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
