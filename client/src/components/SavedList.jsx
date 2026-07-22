// SavedList.jsx — the student's SAVED colleges (persisted). Distinct from
// "Matches" (live recommendations). Always shows what you've saved, so the tab
// is never mysteriously blank.
import React from "react";
import { CategoryTag, SetupPlanningButton } from "./ui.jsx";

export function SavedList({ studentId, saved, onOpen, onRemove, onClearAll }) {
  if (!saved.length) {
    return (
      <div className="empty">
        Your saved list is empty. Go to <strong>Matches</strong> or <strong>Top STEM</strong> and tap
        <span className="pill" style={{ margin: "0 4px" }}>+ List</span> on colleges you like — they'll appear here and in your Tracker.
      </div>
    );
  }
  const byCat = { Reach: [], Target: [], Safety: [], Unknown: [] };
  saved.forEach((s) => { (byCat[s.category] || byCat.Unknown).push(s); });

  // Client-side export -- the full list is already in memory (no extra round
  // trip needed), same csvEscape approach Compare.jsx uses.
  const csvEscape = (v) => { const s = v === null || v === undefined ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const exportCsv = () => {
    const headers = ["College", "City", "State", "Category", "Admission probability", "Overall fit score", "Status"];
    const lines = [headers.join(",")];
    for (const s of saved) {
      lines.push([
        s.college_name || s.name || s.college_id, s.city, s.state, s.category,
        s.admission_probability_range, s.overall_fit_score, s.status,
      ].map(csvEscape).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `my-college-list-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stack">
      <div className="row spread wrap">
        <div>
          <div className="eyebrow">Saved</div>
          <h1>My college list</h1>
          <p className="lead">The colleges you've saved. These feed your Compare, Tracker, and reports.</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn ghost" onClick={exportCsv}>Export CSV</button>
          {onClearAll && (
            <button className="btn ghost" style={{ color: "var(--reach)" }}
              onClick={() => { if (confirm(`Remove all ${saved.length} colleges from your list? Your profile and application tracker are NOT affected.`)) onClearAll(); }}>
              Clear my list
            </button>
          )}
        </div>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="n">{saved.length}</div><div className="l">Saved</div></div>
        <div className="kpi"><div className="n" style={{ color: "var(--reach)" }}>{byCat.Reach.length}</div><div className="l">▲ Reach</div></div>
        <div className="kpi"><div className="n" style={{ color: "var(--target)" }}>{byCat.Target.length}</div><div className="l">◆ Target</div></div>
        <div className="kpi"><div className="n" style={{ color: "var(--safety)" }}>{byCat.Safety.length}</div><div className="l">● Safety</div></div>
      </div>

      <div className="stack">
        {saved.map((s) => (
          <div key={s.college_id} className="card pad stack" style={{ gap: 8 }}>
            <div className="row spread">
              <div>
                <h3 style={{ marginBottom: 3 }}>{s.college_name || s.name || s.college_id}</h3>
                <div className="note">{[s.city, s.state].filter(Boolean).join(", ")}
                  {s.overall_fit_score != null ? ` · Fit ${s.overall_fit_score}` : ""}
                  {s.status ? ` · ${s.status}` : ""}</div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                {s.category && <CategoryTag category={s.category} range={s.admission_probability_range} />}
                <button className="btn ghost sm" onClick={() => onOpen(s.college_id)}>Details</button>
                <button className="btn ghost sm" onClick={() => onRemove(s.college_id)}>Remove</button>
              </div>
            </div>
            {studentId && (
              <div>
                <SetupPlanningButton studentId={studentId} collegeId={s.college_id} collegeName={s.college_name || s.name || s.college_id} state={s.state} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
