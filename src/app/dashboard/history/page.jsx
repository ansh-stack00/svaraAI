"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/router";

export default function CallHistoryPage() {
    const router = useRouter
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState("started_at");
    const [sortDir, setSortDir] = useState("desc");
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchCall() {
        try {
            const data = await axios.get("/api/calls/history");
            setCalls(data.data.calls);
        } catch (err) {
            console.error("Failed to fetch calls:", err);
        } finally {
            setLoading(false);
        }
        }
        fetchCall();
    }, []);

    function formatDuration(start, end) {
        if (!start || !end) return "0m 0s";
        const seconds = Math.floor((new Date(end) - new Date(start)) / 1000);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    }

    function formatDate(dateStr) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString("en-US", {
        month: "numeric", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
        });
    }

    function handleSort(field) {
        if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortDir("asc"); }
    }

    const filtered = calls
        .filter(c => statusFilter === "all" || c.status === statusFilter)
        .filter(c => search === "" || c.id?.toLowerCase().includes(search.toLowerCase()) || c.agents?.name?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
        let av = a[sortField], bv = b[sortField];
        if (sortField === "started_at") { av = new Date(av); bv = new Date(bv); }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
        });

    const SortIcon = ({ field }) => (
        <span className="ml-1 opacity-40 text-xs">
        {sortField === field ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
        </span>
    );

    const statusDot = (status) => {
        const colors = { completed: "#22c55e", failed: "#ef4444", in_progress: "#3b82f6", unknown: "#9ca3af" };
        return <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[status] || colors.unknown, display: "inline-block", marginRight: 6 }} />;
    };

    const columns = [
        { key: "recording", label: "RECORDING", sortable: false },
        { key: "id", label: "CALL ID", sortable: true },
        { key: "direction", label: "IN/OUT", sortable: false },
        { key: "to", label: "TO", sortable: false },
        { key: "from", label: "FROM", sortable: false },
        { key: "duration", label: "DURATION", sortable: true },
        { key: "issues", label: "ISSUES", sortable: false },
        { key: "started_at", label: "CREATED", sortable: true },
        { key: "status", label: "STATUS", sortable: true },
        { key: "agent", label: "AGENT", sortable: false },
    ];

    return (
        <div style={{ fontFamily: "'Geist', 'DM Mono', monospace", background: "#f9f9f8", minHeight: "100vh" }}>

        {/* Toolbar */}
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 20px", borderBottom: "1px solid #e5e5e3",
            background: "#fff", gap: 12
        }}>
            <div style={{ display: "flex", gap: 8 }}>
            {/* Quick Filters */}
            <button style={toolbarBtn}>
                <span style={{ marginRight: 6 }}>⚡</span> Quick Filters
                <span style={{ marginLeft: 6, opacity: 0.5 }}>▾</span>
            </button>
            <button style={toolbarBtn}>
                <span style={{ marginRight: 6 }}>⇅</span> Load Filters
            </button>

            {/* Status pills */}
            {["all", "completed", "failed", "in_progress"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                ...toolbarBtn,
                background: statusFilter === s ? "#1a1a1a" : "transparent",
                color: statusFilter === s ? "#fff" : "#555",
                border: statusFilter === s ? "1px solid #1a1a1a" : "1px solid #e5e5e3",
                }}>
                {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </button>
            ))}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Search */}
            <input
                placeholder="Search call ID or agent..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                padding: "6px 12px", fontSize: 13, border: "1px solid #e5e5e3",
                borderRadius: 6, outline: "none", background: "#fafaf9", width: 220,
                fontFamily: "inherit", color: "#1a1a1a"
                }}
            />
            <button style={{ ...toolbarBtn, background: "#1a1a1a", color: "#fff", border: "1px solid #1a1a1a" }}>
                + Add filter
            </button>
            </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
                <tr style={{ background: "#fff", borderBottom: "1px solid #e5e5e3" }}>
                {columns.map(col => (
                    <th key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{
                        padding: "10px 16px", textAlign: "left", fontWeight: 500,
                        fontSize: 11, letterSpacing: "0.06em", color: "#888",
                        whiteSpace: "nowrap", cursor: col.sortable ? "pointer" : "default",
                        userSelect: "none", borderRight: "1px solid #f0f0ee"
                    }}
                    >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span style={{ opacity: 0.4, fontSize: 10 }}>⠿</span>
                        {col.label}
                        {col.sortable && <SortIcon field={col.key} />}
                    </span>
                    </th>
                ))}
                </tr>
            </thead>

            <tbody>
                {loading && (
                <tr>
                    <td colSpan={columns.length} style={{ textAlign: "center", padding: "60px 0", color: "#aaa" }}>
                    <div style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 20 }}>⟳</div>
                    <p style={{ marginTop: 8, fontSize: 13 }}>Loading calls...</p>
                    </td>
                </tr>
                )}

                {!loading && filtered.length === 0 && (
                <tr>
                    <td colSpan={columns.length} style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📞</div>
                    <p style={{ fontSize: 14, color: "#888" }}>No calls found</p>
                    </td>
                </tr>
                )}

                {!loading && filtered.map((call, i) => (
                <Link key={call.id} href={`/dashboard/history/${call.id}`} legacyBehavior>
                    <tr
                    style={{
                        background: i % 2 === 0 ? "#fff" : "#fafaf9",
                        borderBottom: "1px solid #f0f0ee",
                        cursor: "pointer",
                        transition: "background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f4f4f2"}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafaf9"}
                    >
                    {/* Recording */}
                    <td style={td}>-</td>

                    {/* Call ID */}
                    <td style={td}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: "monospace", color: "#555" }}>
                            {call.id?.slice(0, 8)}...
                        </span>
                        <button onClick={e => { e.preventDefault(); navigator.clipboard.writeText(call.id); }}
                            style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.4, fontSize: 12, padding: 0 }}>
                            ⧉
                        </button>
                        </span>
                    </td>

                    {/* In/Out */}
                    <td style={td}>
                        <span style={{ fontSize: 16, color: "#888" }}>↙</span>
                    </td>

                    {/* To */}
                    <td style={td}>
                        {call.to ? (
                        <span style={{ background: "#eee", borderRadius: 4, padding: "2px 8px", fontSize: 12 }}>
                            {call.to}
                        </span>
                        ) : (
                        <span style={{ background: "#f0f0ee", borderRadius: 4, padding: "2px 8px", fontSize: 12, color: "#888" }}>
                            Web Client
                        </span>
                        )}
                    </td>

                    {/* From */}
                    <td style={td}><span style={{ color: "#aaa" }}>-</span></td>

                    {/* Duration */}
                    <td style={td}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                            width: 40, height: 16, background: "#e5e5e3", borderRadius: 2,
                            display: "inline-block", position: "relative", overflow: "hidden"
                        }}>
                            <span style={{
                            position: "absolute", left: 0, top: 0, bottom: 0,
                            width: `${Math.min(100, ((call.duration || 0) / 300) * 100)}%`,
                            background: "#1a1a1a", borderRadius: 2
                            }} />
                        </span>
                        {formatDuration(call.started_at , call.ended_at)}
                        </span>
                    </td>

                    {/* Issues */}
                    <td style={td}><span style={{ color: "#aaa" }}>-</span></td>

                    {/* Created */}
                    <td style={td}>
                        <span style={{ color: "#555" }}>{formatDate(call.started_at)}</span>
                    </td>

                    {/* Status */}
                    <td style={td}>
                        <span style={{ display: "flex", alignItems: "center" }}>
                        {statusDot(call.status)}
                        <span style={{ color: "#555", textTransform: "capitalize" }}>
                            {call.status?.replace("_", " ") || "Unknown"}
                        </span>
                        </span>
                    </td>

                    {/* Agent */}
                    <td style={td}>
                        <span style={{ color: "#555" }}>{call.agents?.name || "-"}</span>
                    </td>
                    </tr>
                </Link>
                ))}
            </tbody>
            </table>
        </div>

        {/* Footer count */}
        {!loading && (
            <div style={{ padding: "12px 20px", fontSize: 12, color: "#aaa", borderTop: "1px solid #f0f0ee", background: "#fff" }}>
            Showing {filtered.length} of {calls.length} calls
            </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const toolbarBtn = {
  padding: "6px 12px", fontSize: 12, border: "1px solid #e5e5e3",
  borderRadius: 6, background: "transparent", cursor: "pointer",
  color: "#555", display: "flex", alignItems: "center", fontFamily: "inherit",
  whiteSpace: "nowrap"
};

const td = {
  padding: "12px 16px", color: "#333", whiteSpace: "nowrap",
  borderRight: "1px solid #f0f0ee", verticalAlign: "middle"
};