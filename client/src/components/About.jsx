// About.jsx -- More -> About. A short, visual product overview (not a
// walkthrough document): hero summary, quick actions, feature cards, a
// step-by-step list, and a compact data/verification note. The AI-essay
// policy and legal disclaimer live on their own page (Disclaimer.jsx).
import React from "react";

const FEATURES = [
  { t: "Build your profile", d: "Add SAT/GPA, coursework, interests, budget, goals, and resume so the app can personalize planning." },
  { t: "Explore colleges", d: "Search colleges, majors, programs, courses, and opportunities using official and public data where available." },
  { t: "Save and evaluate", d: "Save colleges to My List, import outside lists, compare options, and evaluate colleges against the student profile." },
  { t: "Plan decisions", d: "Build the final list, verify programs, track cost risk, scholarships, visits, and family strategy." },
  { t: "Apply", d: "Track applications, timelines, essays, recommendations, portals, and deadlines." },
  { t: "Export and review", d: "Download planning data and review saved work through Settings → Data & Export." },
];

const STEPS = [
  "Complete Profile",
  "Explore colleges and majors",
  "Save colleges to My List",
  "Use Evaluate Against My Profile",
  "Move serious colleges to Decision Plan",
  "Verify programs, essays, deadlines, and costs",
  "Track applications in Apply",
];

// Simple horizontal flow, no per-step description boxes -- just the shape
// of the app so a family isn't lost, not another thing to read.
function Flow() {
  const steps = ["Profile", "Explore", "My List", "Plan", "Apply"];
  return (
    <div className="row wrap" style={{ gap: 8, alignItems: "center", justifyContent: "center" }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <span className="pill" style={{ fontSize: 13, padding: "6px 12px" }}>{s}</span>
          {i < steps.length - 1 && <span style={{ color: "var(--muted)" }} aria-hidden>→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

export function About({ onGo }) {
  const go = (view) => (onGo ? () => onGo(view) : undefined);
  return (
    <div className="stack" style={{ maxWidth: 900 }}>
      {/* 1. Hero summary */}
      <div className="banner">
        <div className="eyebrow">More</div>
        <h1>About CollegeGene Navigator</h1>
        <p className="lead">CollegeGene Navigator helps families build a smarter college list, compare programs,
          track applications, manage essays, verify deadlines, review costs, and organize final decisions in one
          place.</p>
      </div>

      {/* 2. Quick action buttons */}
      {onGo && (
        <div className="row wrap" style={{ gap: 10 }}>
          <button className="btn amber" onClick={go("profile")}>Start with Profile →</button>
          <button className="btn ghost" onClick={go("advisor")}>Open Advisor →</button>
          <button className="btn ghost" onClick={go("saved")}>Go to My List →</button>
          <button className="btn ghost" onClick={go("decisionPlan")}>Open Decision Plan →</button>
        </div>
      )}

      <Flow />

      {/* 3. Feature cards */}
      <div className="grid cols-3" style={{ gap: 12 }}>
        {FEATURES.map((f) => (
          <div key={f.t} className="card pad stack" style={{ gap: 4 }}>
            <h3 style={{ fontSize: 15 }}>{f.t}</h3>
            <p className="note" style={{ margin: 0 }}>{f.d}</p>
          </div>
        ))}
      </div>

      {/* 4. How to use it step-by-step */}
      <div className="card pad stack">
        <h3>How to use it</h3>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {STEPS.map((s) => (
            <li key={s} className="note" style={{ padding: "3px 0", color: "var(--ink-900)" }}>{s}</li>
          ))}
        </ol>
      </div>

      {/* 5. Data and verification note */}
      <div className="disclaimer">
        CollegeGene Navigator uses official and public data where available, including College Scorecard and
        college websites. College requirements, deadlines, essay prompts, costs, and program rules can change.
        Always verify final information using official college sources and application portals.
        {onGo && <> <button className="link" onClick={go("disclaimer")}>Read the full disclaimer →</button></>}
      </div>
    </div>
  );
}
