// About.jsx -- explains how CollegeGene Navigator works, its data sources, and
// the disclaimer. Shown from the landing page's "How it works" link.
import React from "react";

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

      <div className="card pad stack">
        <h3>Finding your way around</h3>
        <p className="note">The top menu has 7 tabs: <strong>Dashboard</strong> (your home/command center),
          <strong> Profile</strong>, <strong>Explore</strong> (Matches, Browse Colleges, Majors, Double Major
          Search, Programs &amp; Opportunities, Courses &amp; Prep, Advisor), <strong>My List</strong> (My Colleges,
          Import Colleges, Compare), <strong>Plan</strong> (Decision Plan, Journey, Verification Center, Final List
          Health Check, Strategy, Cost, Scholarships &amp; Honors, Visits / Interest), <strong>Apply</strong>
          (Application Pathways, Timeline, Essays, Applications Tracker, Recommendations, Portal Tracker, Financial
          Aid), and <strong>More</strong> (Info, Help, Disclaimer, Export, Settings). Click a tab to see its subtabs
          underneath. Nothing described below moved out of the app -- only how it's grouped changed.</p>
      </div>

      <div className="card pad stack">
        <h3>1. Build your profile</h3>
        <p className="note">Enter academics (GPA, SAT/ACT, rigor, rank), interests, budget, and goals -- or upload a
          transcript/resume and let the app help fill it in. The more complete the profile, the more accurate
          everything downstream is.</p>
      </div>

      <div className="card pad stack">
        <h3>2. Get real college matches</h3>
        <p className="note">The app pulls real colleges from the U.S. Department of Education College Scorecard and
          scores each one across academic fit, cost, career outcomes, and extracurricular strength -- sorted into
          <strong> Reach</strong>, <strong>Target</strong>, and <strong>Safety</strong> as ranges, never false
          precision. Find this under <strong>Explore -&gt; Matches</strong> (Best Fit and Balanced List views) or
          <strong> Explore -&gt; Browse Colleges</strong>. Save the ones you like to <strong>My List</strong>, where
          "Evaluate Against My Profile" re-scores every saved college -- including imported ones -- and shows
          Fit/Admit/Est. cost/Major fit on each card.</p>
      </div>

      <div className="card pad stack">
        <h3>3. Research programs &amp; opportunities</h3>
        <p className="note">The <strong>Explore -&gt; Programs &amp; Opportunities</strong> subtab looks beyond just
          majors -- minors, honors/scholars programs, research opportunities, and other special programs -- using
          College Scorecard data plus official college sources you or the app add. Every record shows its source,
          when it was last checked, and whether it still needs manual verification. Program discovery may be
          incomplete; always verify final decisions on official college websites.</p>
      </div>

      <div className="card pad stack">
        <h3>4. Build a real Decision Plan</h3>
        <p className="note">The <strong>Plan -&gt; Decision Plan</strong> subtab is the family's working area: a
          final application list by category, a program verification checklist, major-specific admission risk, cost
          tracking, auto-generated strategy notes, a task/deadline tracker, and CSV export. The same page also
          surfaces the <strong>Verification Center</strong> (every open verification item across your list) and the
          <strong> Final List Health Check</strong> (balance, risk, cost, workload) -- both reachable directly from
          the <strong>Plan</strong> subtab bar. <strong>Plan -&gt; Strategy</strong> gives whole-list strategy and
          early-action/early-decision guidance; <strong>Plan -&gt; Scholarships &amp; Honors</strong> tracks the
          scholarships you find.</p>
      </div>

      <div className="card pad stack">
        <h3>5. Plan applications and essays</h3>
        <p className="note">The <strong>Apply -&gt; Application Pathways</strong> subtab starts with the
          <strong> Timeline</strong> section -- pull real deadline, notification, and enrollment dates for a saved
          college with one click, either from a small set of hand-verified reference colleges (instant,
          source-cited) or a live, bounded search of that college's own official site as a fallback. The Route
          Planner groups your list by application platform and lets you set a platform in one step, which
          automatically pulls in the dates (and, for a growing list of reference colleges, application-detail
          fields like test policy, fee, and whether an interview/portfolio/recommendation is required) into your
          application record. <strong>Apply -&gt; Essays</strong> tracks each college's essay prompts the same way
          -- reference-first for a small set of verified colleges, live official-site search as the fallback --
          plus generic (never copied or invented) brainstorming aids by track, and links to colleges' own published
          sample essays where they exist. <strong>Apply -&gt; Applications Tracker</strong> is your day-to-day
          checklist (essays, recommendations, deadlines, submitted status); <strong>Apply -&gt; Financial
          Aid</strong> covers FAFSA/CSS Profile planning. The <strong>Explore -&gt; Advisor</strong> chat answers
          essay questions only from prompts you've actually tracked -- it never guesses a college's prompt wording.</p>
      </div>

      <div className="card pad stack">
        <h3>6. Explore majors, courses &amp; careers</h3>
        <p className="note">See where a major leads using U.S. Bureau of Labor Statistics career data. The
          <strong> Explore -&gt; Majors</strong> subtab includes a double-major planner (also reachable directly as
          <strong> Explore -&gt; Double Major Search</strong>). <strong>Explore -&gt; Courses &amp; Prep</strong>
          gives track-based preparation guidance as well as a per-college program browser.</p>
      </div>

      <div className="card pad stack">
        <h3>Where the data comes from</h3>
        <p className="note">College facts come from the <strong>U.S. Department of Education College Scorecard</strong>.
          Career figures come from the <strong>U.S. Bureau of Labor Statistics</strong>. Program and admissions
          details come from official college sources, each labeled with a source, a last-checked date, and a
          verification status. Fit scores and Reach/Target/Safety categories are <strong>estimates</strong>. Where a
          fact isn't published or verified, the app says so rather than inventing it.</p>
      </div>

      <div className="disclaimer">
        <strong>AI &amp; essay policy.</strong> CollegeGene Navigator helps with brainstorming, outlining, prompt
        tracking, story mapping, and revision planning. It never generates a finished essay for submission and never
        presents any AI-written text as ready to submit. The student must write the final essay in their own voice
        and follow each college's own AI-use policy -- these vary by school and change over time, so check the
        official application portal before submitting.
      </div>

      <div className="disclaimer">
        <strong>Disclaimer.</strong> CollegeGene Navigator is a planning aid, not a counseling service or an
        admissions office. Admissions are holistic, competitive, and unpredictable, and these estimates are not
        guarantees. College costs, aid, deadlines, scholarship availability, program offerings, and career outcomes
        vary and change over time. Always confirm information with each college's official website, net price
        calculator, admissions and financial-aid offices, FAFSA/CSS Profile, and a qualified school counselor before
        making decisions.
      </div>

      {onGo && (
        <div className="row" style={{ gap: 8 }}>
          <button className="btn amber" onClick={go("journey")}>See the Journey roadmap</button>
          <button className="btn ghost" onClick={go("profile")}>Start your profile</button>
        </div>
      )}
    </div>
  );
}
