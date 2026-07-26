// About.jsx -- explains what CollegeGene Navigator is and how it works.
// Shown from the landing page's "How it works" link and from More -> About.
// The disclaimer / AI-essay-policy text lives on its own page (Disclaimer.jsx)
// -- this page is only the walkthrough.
import React from "react";

// A small horizontal flow diagram of the main path through the app, so a
// family can see the whole shape of it at a glance before reading the
// numbered sections below. Plain HTML/CSS (cards + arrows), not an image, so
// it always matches the app's real section names.
function Flow() {
  const steps = [
    { t: "Profile", d: "Academics, interests, budget, activities" },
    { t: "Explore", d: "Matches, Browse Colleges, Majors" },
    { t: "My List", d: "Save colleges, Evaluate Against My Profile" },
    { t: "Plan", d: "Decision Plan, Verification, Final List Health, Strategy" },
    { t: "Apply", d: "Pathways, Timeline, Essays, Applications" },
  ];
  return (
    <div className="card pad">
      <div className="row wrap" style={{ gap: 4, alignItems: "stretch", justifyContent: "center" }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.t}>
            <div style={{
              flex: "1 1 150px", minWidth: 130, maxWidth: 180, background: "var(--paper-2)",
              borderRadius: 10, padding: "12px 12px", textAlign: "center",
            }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{s.t}</div>
              <div className="note" style={{ fontSize: 11.5, marginTop: 4 }}>{s.d}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ display: "flex", alignItems: "center", fontSize: 20, color: "var(--muted)", padding: "0 2px" }} aria-hidden>→</div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="note" style={{ textAlign: "center", marginTop: 10 }}>
        <strong>Dashboard</strong> is the home base you can return to from any step -- it summarizes where you stand
        across all of these. <strong>More</strong> holds reference material (About, Disclaimer, Settings).
      </div>
    </div>
  );
}

export function About({ onGo }) {
  const go = (view) => (onGo ? () => onGo(view) : undefined);
  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <div>
        <div className="eyebrow">About</div>
        <h1>How CollegeGene Navigator works</h1>
        <p className="lead">A real college, program, course, and application strategy platform -- built to help one
          family navigate the whole search and admissions process on official data, not guesswork.</p>
      </div>

      <Flow />

      <div className="card pad stack">
        <h3>Profile</h3>
        <p className="note">Enter academics (GPA, SAT/ACT, rigor, rank), interests, budget, and goals -- or upload a
          transcript/resume and let the app help fill it in. The more complete the profile, the more accurate
          everything downstream is.</p>
      </div>

      <div className="card pad stack">
        <h3>Explore: find colleges</h3>
        <p className="note">The app pulls real colleges from the U.S. Department of Education College Scorecard and
          scores each one across academic fit, cost, career outcomes, and extracurricular strength -- sorted into
          <strong> Reach</strong>, <strong>Target</strong>, and <strong>Safety</strong> as ranges, never false
          precision. <strong>Matches</strong> (Best Fit and Balanced List), <strong>Browse Colleges</strong>,
          <strong> Majors</strong> (including a double-major planner), <strong>Programs &amp; Opportunities</strong>
          (minors, honors/scholars programs, research), <strong>Courses &amp; Prep</strong>, and the
          <strong> Advisor</strong> chat all live here.</p>
      </div>

      <div className="card pad stack">
        <h3>My List: save and evaluate</h3>
        <p className="note">Save colleges you like to <strong>My List</strong>, or import a list you already have.
          "Evaluate Against My Profile" re-scores every saved college -- including imported ones -- and shows
          Fit/Admit/Est. cost/Major fit on each card. <strong>Compare</strong> puts saved colleges side by side.</p>
      </div>

      <div className="card pad stack">
        <h3>Plan: build the real final list</h3>
        <p className="note"><strong>Decision Plan</strong> is the family's working area: a final application list
          by category, a program verification checklist, major-specific admission risk, cost tracking,
          auto-generated strategy notes, a task/deadline tracker, and CSV export. The same area surfaces the
          <strong> Verification Center</strong> (every open verification item across your list) and the
          <strong> Final List Health Check</strong> (balance, risk, cost, workload). <strong>Strategy</strong> gives
          whole-list strategy and early-action/early-decision guidance; <strong>Scholarships &amp; Honors</strong>
          tracks scholarships you find.</p>
      </div>

      <div className="card pad stack">
        <h3>Apply: pathways, timeline, essays</h3>
        <p className="note"><strong>Application Pathways</strong> starts with the <strong>Timeline</strong> --
          pull real deadline, notification, and enrollment dates for a saved college with one click, either from a
          small set of hand-verified reference colleges (instant, source-cited) or a live, bounded search of that
          college's own official site as a fallback. The Route Planner groups your list by application platform.
          <strong> Essays</strong> tracks each college's prompts the same way -- reference-first for verified
          colleges, live official-site search as the fallback -- plus generic (never copied or invented)
          brainstorming aids and links to colleges' own published sample essays. <strong>Applications
          Tracker</strong> is your day-to-day checklist (essays, recommendations, deadlines, submitted status);
          <strong> Financial Aid</strong> covers FAFSA/CSS Profile planning.</p>
      </div>

      <div className="card pad stack">
        <h3>Where the data comes from</h3>
        <p className="note">College facts come from the <strong>U.S. Department of Education College Scorecard</strong>.
          Career figures come from the <strong>U.S. Bureau of Labor Statistics</strong>. Program and admissions
          details come from official college sources, each labeled with a source, a last-checked date, and a
          verification status. Fit scores and Reach/Target/Safety categories are <strong>estimates</strong>. Where a
          fact isn't published or verified, the app says so rather than inventing it.</p>
      </div>

      {onGo && (
        <div className="row wrap" style={{ gap: 8 }}>
          <button className="btn amber" onClick={go("journey")}>See the Journey roadmap</button>
          <button className="btn ghost" onClick={go("profile")}>Start your profile</button>
          <button className="btn ghost" onClick={go("disclaimer")}>Read the full disclaimer →</button>
        </div>
      )}
    </div>
  );
}
