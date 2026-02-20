"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { CallScorecard } from "@/components/scorecard/scoreCard"; 

export default function CallDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [call, setCall] = useState(null);
    const [transcripts, setTranscripts] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Scorecard state ---
    const [scorecard, setScorecard] = useState(null);
    const [scorecardLoading, setScorecardLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Fetch call + transcripts
    useEffect(() => {
        async function fetchCallDetail() {
            try {
                const { data } = await axios.get(`/api/calls/${id}`);
                setCall(data.call);
                setTranscripts(data.transcripts || []);
            } catch (err) {
                console.error("Failed to fetch call:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchCallDetail();
    }, [id]);

    // Fetch existing scorecard
    useEffect(() => {
        if (!id) return;
        async function fetchScorecard() {
            try {
                const { data } = await axios.get(`/api/analytics/scorecard?call_id=${id}`);
                setScorecard(data.scorecard);
            } catch (err) {
                // 404 means no scorecard yet — that's fine
                if (err?.response?.status !== 404) {
                    console.error("Failed to fetch scorecard:", err);
                }
            } finally {
                setScorecardLoading(false);
            }
        }
        fetchScorecard();
    }, [id]);

    // Generate scorecard
    async function handleGenerateScorecard() {
        setGenerating(true);
        try {
            const { data } = await axios.post(`/api/analytics/scorecard`, { call_id: id });
            setScorecard(data.scoreCard ?? data.scorecard);
        } catch (err) {
            console.error("Failed to generate scorecard:", err);
        } finally {
            setGenerating(false);
        }
    }

    function formatDuration(start, end) {
        if (!start || !end) return "0m 0s";
        const seconds = Math.floor((new Date(end) - new Date(start)) / 1000);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}`;
    }

    function downloadTranscript(id, format) {
        window.open(`/api/calls/${id}/export/${format}`, '_blank');
    }

    function formatDate(dateStr) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString("en-US", {
            month: "numeric", day: "numeric", year: "numeric",
            hour: "numeric", minute: "2-digit", hour12: true,
        });
    }

    const statusColor = {
        completed:   { bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
        failed:      { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
        in_progress: { bg: "#eff6ff", text: "#2563eb", dot: "#3b82f6" },
    };
    const sc = statusColor[call?.status] || { bg: "#f9fafb", text: "#6b7280", dot: "#9ca3af" };

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: "monospace" }}>
            <div style={{ textAlign: "center", color: "#888" }}>
                <div style={{ fontSize: 28, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
                <p style={{ marginTop: 12, fontSize: 13 }}>Loading call details...</p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!call) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 32 }}>📞</p>
                <p style={{ color: "#888", marginTop: 8 }}>Call not found</p>
                <button onClick={() => router.back()} style={backBtnStyle}>← Go Back</button>
            </div>
        </div>
    );

    return (
        <div style={{ fontFamily: "'Geist', 'DM Mono', monospace", background: "#f9f9f8", minHeight: "100vh", padding: "32px 24px" }}>
            <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

                {/* Back + Header */}
                <div>
                    <button onClick={() => router.back()} style={backBtnStyle}>← Back to History</button>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Call Details</h1>
                            <p style={{ fontSize: 12, color: "#aaa", marginTop: 4, fontFamily: "monospace" }}>{call.id}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                background: sc.bg, color: sc.text,
                                padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 500
                            }}>
                                <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                                {call.status?.replace("_", " ") || "Unknown"}
                            </span>
                            <button
                                onClick={() => downloadTranscript(call.id, 'txt')}
                                style={{
                                    padding: "7px 14px", fontSize: 12, cursor: "pointer",
                                    border: "1px solid #e5e5e3", borderRadius: 6,
                                    background: "#fff", color: "#555", fontFamily: "inherit",
                                    display: "flex", alignItems: "center", gap: 6
                                }}
                            >
                                ⬇ Download TXT
                            </button>
                            <button
                                onClick={() => downloadTranscript(call.id, 'pdf')}
                                style={{
                                    padding: "7px 14px", fontSize: 12, cursor: "pointer",
                                    border: "1px solid #1a1a1a", borderRadius: 6,
                                    background: "#1a1a1a", color: "#fff", fontFamily: "inherit",
                                    display: "flex", alignItems: "center", gap: 6
                                }}
                            >
                                ⬇ Download PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    {[
                        { label: "Agent",       value: call.agents?.name || "-",                     icon: "🤖" },
                        { label: "Duration",    value: formatDuration(call.started_at, call.ended_at), icon: "⏱" },
                        { label: "Started At",  value: formatDate(call.started_at),                   icon: "📅" },
                        { label: "From",        value: call.from || "-",                              icon: "📲" },
                        { label: "To",          value: call.to || "Web Client",                       icon: "📞" },
                        { label: "Transcripts", value: transcripts.length,                            icon: "💬" },
                    ].map(({ label, value, icon }) => (
                        <div key={label} style={{
                            background: "#fff", border: "1px solid #e5e5e3",
                            borderRadius: 10, padding: "16px 18px"
                        }}>
                            <p style={{ fontSize: 11, color: "#aaa", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                {icon} {label}
                            </p>
                            <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* ── AI Scorecard ── */}
                {!scorecardLoading && (
                    <CallScorecard
                        callId={id}
                        scorecard={scorecard}
                        onGenerate={handleGenerateScorecard}
                        generating={generating}
                    />
                )}

                {/* Transcript */}
                <div style={{ background: "#fff", border: "1px solid #e5e5e3", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0ee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>💬 Transcript</h2>
                        <span style={{ fontSize: 12, color: "#aaa" }}>{transcripts.length} messages</span>
                    </div>

                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16, maxHeight: 520, overflowY: "auto" }}>
                        {transcripts.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb" }}>
                                <p style={{ fontSize: 28 }}>📭</p>
                                <p style={{ fontSize: 13, marginTop: 8 }}>No transcript available</p>
                            </div>
                        ) : (
                            transcripts.map((t, i) => {
                                const isAgent = t.role === "agent" || t.speaker === "agent";
                                return (
                                    <div key={t.id || i} style={{
                                        display: "flex",
                                        flexDirection: isAgent ? "row" : "row-reverse",
                                        gap: 10, alignItems: "flex-start"
                                    }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                                            background: isAgent ? "#1a1a1a" : "#6366f1",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 14
                                        }}>
                                            {isAgent ? "🤖" : "👤"}
                                        </div>
                                        <div style={{ maxWidth: "72%" }}>
                                            <p style={{
                                                fontSize: 11, color: "#aaa", marginBottom: 4,
                                                textAlign: isAgent ? "left" : "right"
                                            }}>
                                                {isAgent ? (call.agents?.name || "Agent") : "User"}
                                                {t.created_at && ` · ${formatDate(t.created_at)}`}
                                            </p>
                                            <div style={{
                                                background: isAgent ? "#f4f4f2" : "#1a1a1a",
                                                color: isAgent ? "#1a1a1a" : "#fff",
                                                padding: "10px 14px", borderRadius: isAgent ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                                                fontSize: 13, lineHeight: 1.6
                                            }}>
                                                {t.text || t.content || t.message || "-"}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

const backBtnStyle = {
    background: "none", border: "1px solid #e5e5e3", borderRadius: 6,
    padding: "6px 12px", fontSize: 12, color: "#555", cursor: "pointer",
    fontFamily: "inherit"
};