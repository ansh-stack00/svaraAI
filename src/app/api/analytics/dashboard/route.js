import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("Unauthorized access", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch calls with analytics
    const { data: calls, error: callError } = await supabase
      .from("calls")
      .select(
        `*,call_analytics(
          quality_score,
          sentiment,
          accuracy_score,
          goal_completed
        )`
      )
      .eq("user_id", user.id)
      .gte("started_at", startDate.toISOString()) 
      .order("started_at", { ascending: true });

    if (callError) {
      console.log("Error fetching calls with analytics", callError);
      return NextResponse.json(
        { error: "Error fetching calls with analytics" },
        { status: 500 }
      );
    }

    
    function getDurationSeconds(start, end) {
      if (!start || !end) return 0;
      return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
    }

    function formatDuration(seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}m ${s}s`;
    }

    // Calculations
    const totalCalls = calls?.length || 0;
    const completedCalls = calls?.filter((c) => c.status === "completed").length || 0;

    const totalDurationSeconds =
      calls?.reduce((sum, c) => sum + getDurationSeconds(c.started_at, c.ended_at), 0) ?? 0;
    const avgDurationSeconds = completedCalls > 0
      ? Math.floor(totalDurationSeconds / completedCalls)
      : 0;
    const avgDuration = formatDuration(avgDurationSeconds);

    // Calls by date
    const callsByDate = {};
    calls?.forEach((call) => {
      const date = new Date(call.started_at).toISOString().split("T")[0];
      callsByDate[date] = (callsByDate[date] || 0) + 1;
    });

    // Fill in missing dates
    const callsOverTime = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      callsOverTime.push({ date: dateStr, count: callsByDate[dateStr] || 0  });
    }

    // Calls with analytics scores
    const callsWithScores =
      calls?.filter((c) => c.call_analytics && c.call_analytics.length > 0) || [];

    // Average quality score
    const avgQualityScore =
      callsWithScores.length > 0
        ? callsWithScores.reduce((sum, c) => sum + (c.call_analytics[0]?.quality_score || 0), 0) /
          callsWithScores.length
        : 0;
 
    const sentimentCounts= {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    callsWithScores.forEach((call) => {
      const sentiment = call.call_analytics[0]?.sentiment;
      if (sentiment && sentiment in sentimentCounts) {
        sentimentCounts[sentiment]++;
      }
    });

    // Success rate (goal completion)
    const callsWithGoals = callsWithScores.filter(
      (c) => c.call_analytics[0]?.goal_completed !== null
    );

    const successRate =
      callsWithGoals.length > 0
        ? (callsWithGoals.filter((c) => c.call_analytics[0]?.goal_completed === true).length /
            callsWithGoals.length) *
          100
        : 0;

    // BUG FIX: avgDurationOverTime now uses started_at/ended_at instead of missing `duration` field
    const durationByDate = {};
    calls?.forEach((call) => {
      const seconds = getDurationSeconds(call.started_at, call.ended_at);
      if (seconds > 0) {
        const date = new Date(call.started_at).toISOString().split("T")[0];
        if (!durationByDate[date]) {
          durationByDate[date] = { total: 0, count: 0 };
        }
        durationByDate[date].total += seconds;
        durationByDate[date].count += 1;
      }
    });

    const avgDurationOverTime = Object.entries(durationByDate).map(([date, data]) => ({
      date,
      avgDurationSeconds: Math.floor(data.total / data.count),
      avgDurationFormatted: formatDuration(Math.floor(data.total / data.count)),
    }));

    return NextResponse.json({
      metrics: {
        totalCalls,
        completedCalls,
        avgDuration,           
        avgDurationSeconds,    
        avgQualityScore: Math.round(avgQualityScore * 10) / 10,
        successRate: Math.round(successRate * 10) / 10,
      },
      callsOverTime,
      avgDurationOverTime,
      sentimentDistribution: sentimentCounts,
      callsWithAnalytics: callsWithScores.length,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}