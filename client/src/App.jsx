// App.jsx -- top-level shell. Routes between views, loads live recommendations,
// and persists the student's list to the backend DB.
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "./lib/api.js";
import { ProfileForm, BLANK_PROFILE } from "./components/ProfileForm.jsx";
import { Results } from "./components/Results.jsx";
import { CollegeDetail } from "./components/CollegeDetail.jsx";
import { Advisor } from "./components/Advisor.jsx";
import { Documents } from "./components/Documents.jsx";
import { Courses } from "./components/Courses.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { Majors } from "./components/Majors.jsx";
import { Strategy } from "./components/Strategy.jsx";
import { Matches } from "./components/Matches.jsx";
import { BrowseColleges } from "./components/BrowseColleges.jsx";
import { MyList } from "./components/MyList.jsx";
import { Info } from "./components/Info.jsx";
import { Applications } from "./components/Applications.jsx";
import { Programs } from "./components/Programs.jsx";
import { DecisionPlan } from "./components/DecisionPlan.jsx";
import { ApplicationPathways } from "./components/ApplicationPathways.jsx";
import { EssayCenter } from "./components/EssayCenter.jsx";
import { About } from "./components/About.jsx";
import { Journey } from "./components/Journey.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { mergeParsedIntoProfile } from "./lib/profileMerge.js";

// A stable signature of the profile fields that affect matching. Used to detect
// when recommendations are stale relative to the current profile.
function profileSignature(p) {
  if (!p) return "";
  // A short normalized fingerprint of activity text so extracurricular-strength
  // changes are detected, without bloating the signature with huge parsed docs.
  const actSig = String(p.activitiesText || p.summary || "").replace(/\s+/g, " ").trim().slice(0, 200);
  return JSON.stringify([
    p.state, p.gpa, p.gpaWeighted, p.sat, p.satSuper, p.act, p.actSuper, p.apCount,
    p.budget, p.costPref, p.testStrategy, p.rigorHigh, p.awards,
    p.hasResearch, p.hasInternship, p.hasLeadership, p.hasVolunteer,
    (p.interests || []).slice().sort(), (p.careerGoals || []).slice().sort(),
    p.preferredScenarioId, p.primaryMajor, p.secondaryMajor,
    actSig, p.gradSchoolInterest, p.incomeGoal, p.riskTolerance,
  ]);
}
import { Spinner, ErrorNote, SourceBadge } from "./components/ui.jsx";
import { useAuth } from "./auth/AuthProvider.jsx";

const FALLBACK_STUDENT_ID = "local-student"; // used only when auth is unconfigured (dev)

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 3c4 3 8 3 12 0M6 21c4-3 8-3 12 0M6 3c0 6 12 12 12 18M18 3C18 9 6 15 6 21"
        stroke="#e9c987" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const TABS = [
  ["dashboard", "Dashboard"],
  ["journey", "Journey"],
  ["profile", "Profile"],
  ["matches", "Matches"],
  ["browse", "Browse Colleges"],
  ["saved", "My List"],
  ["programs", "Programs & Opportunities"],
  ["decisionPlan", "Decision Plan"],
  ["applicationPathways", "Application Pathways"],
  ["essays", "Essay Center"],
  ["majors", "Majors"],
  ["courses", "Courses"],
  ["strategy", "Strategy"],
  ["advisor", "Advisor"],
  ["applications", "Applications"],
  ["info", "Info"],
];

export default function App() {
  const { user, signOut } = useAuth();
  // Per-user data key: the Firebase UID when signed in, else the dev fallback.
  const STUDENT_ID = user?.uid || FALLBACK_STUDENT_ID;
  const [view, setView] = useState("landing");
  // Optional college context carried along with a view switch -- e.g. Decision
  // Plan's "View timeline" / "Go to Essay Center" jump straight to that
  // college's section instead of leaving the family to find it again. goTo is
  // passed down as `onGo`; existing onGo(view) calls (no second arg) keep
  // working exactly as before.
  const [focusCollegeId, setFocusCollegeId] = useState(null);
  const goTo = useCallback((nextView, collegeId) => {
    setFocusCollegeId(collegeId || null);
    setView(nextView);
  }, []);
  const [profile, setProfile] = useState(BLANK_PROFILE);
  // Track id requested from Advisor's "Run Matches for this track" -- preselects
  // the scenario when Matches opens.
  const [advisorTrackId, setAdvisorTrackId] = useState(null);
  // Track id requested from Advisor's "See course & prep plan" -- preselects
  // the track when Courses opens on the "By Career Track" sub-tab.
  const [courseTrackId, setCourseTrackId] = useState(null);
  // Explicit version counter -- bumped whenever the profile is replaced from
  // outside the form (saved load, parsed docs, reset, sample). ProfileForm
  // re-syncs on this, which is far more reliable than a JSON signature.
  const [profileVersion, setProfileVersion] = useState(0);
  const bumpProfile = (next) => { setProfile(next); setProfileVersion((v) => v + 1); };
  // Snapshot of the profile that produced the current recommendations, so we
  // can warn the user when their profile has changed since matching.
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [programVerification, setProgramVerification] = useState(null);
  const [recs, setRecs] = useState([]);
  const [scanned, setScanned] = useState(0);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [saved, setSaved] = useState([]); // list rows from DB

  const savedIds = useMemo(() => new Set(saved.map((s) => s.college_id)), [saved]);
  const collegeNames = useMemo(() => {
    const m = {};
    recs.forEach((r) => { m[r.college.id] = r.college.name; });
    saved.forEach((s) => { if (!m[s.college_id]) m[s.college_id] = s.college_name || s.name || s.college_id; });
    return m;
  }, [recs, saved]);

  // hydrate saved list + profile -- re-runs when the signed-in user changes so
  // each user loads only their own data.
  useEffect(() => { api.getList(STUDENT_ID).then((r) => setSaved(r.list || [])).catch(() => {}); }, [STUDENT_ID]);
  useEffect(() => {
    api.getStudent(STUDENT_ID).then((r) => {
      if (r && r.profile && Object.keys(r.profile).length) { setProfile((p) => ({ ...p, ...r.profile })); setProfileVersion((v) => v + 1); }
    }).catch(() => {});
  }, [STUDENT_ID]);

  const runRecommend = useCallback(async (p, filters) => {
    setLoading(true); setErr(null);
    setView("matches");
    try {
      await api.saveStudent(STUDENT_ID, p).catch(() => {});
      const r = await api.recommend(p, filters);
      setRecs(Array.isArray(r.recommendations) ? r.recommendations : []);
      setMeta(r.meta || null);
      setScanned(r.scanned || 0);
      setProgramVerification(r.programVerification || null);
      setMatchedProfile(profileSignature(p));
    } catch (e) { setErr(e); }
    finally { setLoading(false); }
  }, []);

  // Fields that actually change matching. If any differ, results are stale.
  const profileStale = matchedProfile && matchedProfile !== profileSignature(profile);

  const onSubmitProfile = (p) => { setProfile(p); runRecommend(p); };

  // Merge AI-extracted document fields into the profile (user reviews after).
  const [applyMsg, setApplyMsg] = useState(null);

  const applyParsed = (parsed) => {
    const { profile: next, applied } = mergeParsedIntoProfile(profile, parsed);

    // Infer experience flags from the raw parsed blob when the parser didn't
    // set them explicitly (keeps extracurricular strength accurate).
    const blob = JSON.stringify(parsed || {}).toLowerCase();
    if (next.hasInternship !== true && /intern/.test(blob)) { next.hasInternship = true; applied.push("hasInternship"); }
    if (next.hasLeadership !== true && /president|founder|captain|lead|chair|director/.test(blob)) { next.hasLeadership = true; applied.push("hasLeadership"); }
    if (next.hasVolunteer !== true && /volunteer|service/.test(blob)) { next.hasVolunteer = true; applied.push("hasVolunteer"); }
    if (next.hasResearch !== true && /research|patent|ieee|publication/.test(blob)) { next.hasResearch = true; applied.push("hasResearch"); }

    if (!applied.length) {
      setApplyMsg({ ok: false, text: "The document was read, but no profile fields could be confidently extracted. Please enter the missing fields manually." });
      setView("profile");
      return;
    }

    // Populate the form immediately, then persist. Save failures are surfaced,
    // never swallowed.
    bumpProfile(next);
    setView("profile");
    const pretty = [...new Set(applied)].map(prettyField).join(", ");
    api.saveStudent(STUDENT_ID, next).then(() => {
      setApplyMsg({ ok: true, text: `Profile updated from documents. Applied: ${pretty}. Review the profile and save/rerun matches.` });
      setMatchedProfile(null); // existing matches are now stale
    }).catch((e) => {
      setApplyMsg({ ok: false, text: `Profile fields were extracted, but saving failed: ${e.message}` });
    });
  };

const FIELD_LABELS = {
  gpa: "GPA", gpaWeighted: "weighted GPA", sat: "SAT", satSuper: "SAT superscore",
  act: "ACT", apCount: "AP count", classRank: "class rank", classSize: "class size",
  awards: "awards", interests: "intended majors", activitiesText: "activities",
  hasResearch: "research", hasInternship: "internship", hasLeadership: "leadership",
  hasVolunteer: "service", name: "name", highSchool: "high school", city: "city", state: "state",
};
function prettyField(k) { return FIELD_LABELS[k] || k; }

  // toggleSave(scored, opts, forceAdd)
  //   opts: optional selection-context fields merged into the saved row --
  //     { context, primaryMajor, secondaryMajor, doubleMajorLabel,
  //       doubleMajorStatus, doubleMajorVerificationStatus, doubleMajorNotes }.
  //     `context` should be one of the SELECTION_CONTEXTS labels (see
  //     server/src/services/selectionContext.js); the server merges it into
  //     the college's accumulated selection_contexts rather than overwriting.
  //   forceAdd: when true, never removes an already-saved college -- used by
  //     "Add as double-major option" so re-adding a college that's already on
  //     the list (from a different search) merges in the new pathway instead
  //     of toggling it off.
  const toggleSave = async (scored, opts = {}, forceAdd = false) => {
    const col = scored.college || {};
    const cid = col.id;
    if (!cid) return;
    if (savedIds.has(cid) && !forceAdd) {
      setSaved((s) => s.filter((x) => x.college_id !== cid));
      api.removeListItem(STUDENT_ID, cid).catch(() => {});
      return;
    }
    const adm = scored.admission || {};
    const subs = scored.subs || {};
    const row = {
      college_id: cid, name: col.name || cid, college_name: col.name || cid,
      city: col.city || null, state: col.state || null,
      category: adm.category || null, range: adm.range || null,
      overall: scored.overall ?? null, overall_fit_score: scored.overall ?? null,
      academic: subs.academic ?? null,
      career: subs.career ?? null, financial: subs.financial ?? null, status: "Considering",
      ...opts,
    };
    setSaved((s) => (s.some((x) => x.college_id === cid) ? s : [...s, row]));
    try {
      await api.saveListItem(STUDENT_ID, cid, row);
      // Re-fetch so merged server-side fields (accumulated selection contexts,
      // double-major pathways) are reflected exactly, not guessed client-side.
      const r = await api.getList(STUDENT_ID);
      setSaved(r.list || []);
    } catch { /* saved list keeps the optimistic row; next load will reconcile */ }
  };

  // Direct remove (used by My list) -- avoids relying on a full scored object.
  const removeFromList = (cid) => {
    setSaved((s) => s.filter((x) => x.college_id !== cid));
    api.removeListItem(STUDENT_ID, cid).catch(() => {});
  };

  // Clear the entire saved list (profile + tracker untouched).
  const clearList = () => {
    const ids = saved.map((s) => s.college_id);
    setSaved([]);
    ids.forEach((cid) => api.removeListItem(STUDENT_ID, cid).catch(() => {}));
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner topbar-stack">
          <div className="brand" role="button" onClick={() => setView("landing")} style={{ cursor: "pointer" }}>
            <Logo />
            <span>CollegeGene Navigator<small>A Real College, Program, Course, and Application Strategy Platform</small></span>
          </div>
          <nav className="nav nav-row">
            {TABS.map(([k, label]) => (
              <button key={k} className={view === k ? "active" : ""} onClick={() => goTo(k)}>{label}</button>
            ))}
          </nav>
          {user && (
            <div className="user-menu" style={{ marginLeft: "auto" }}>
              <span className="user-email">
                Signed in as {user.email || user.displayName || "user"}
              </span>
              <button className="btn sm ghost" onClick={() => signOut().catch(() => {})}>Sign out</button>
            </div>
          )}
        </div>
      </header>

      <main className="container">
        <ErrorBoundary resetKey={view}>
          {view === "landing" && <Landing onStart={() => setView("profile")} onAbout={() => setView("about")} />}
          {view === "about" && <About onGo={setView} />}
          {view === "journey" && <Journey studentId={STUDENT_ID} profile={profile} saved={saved} onGo={goTo} />}
          {view === "profile" && <ProfileForm initial={profile} onSubmit={onSubmitProfile} studentId={STUDENT_ID} onApplyParsed={applyParsed} applyMsg={applyMsg} profileVersion={profileVersion} onLoadSample={(sp) => { bumpProfile(sp); api.saveStudent(STUDENT_ID, sp).catch(() => {}); }}
            onSave={(p) => { setProfile(p); api.saveStudent(STUDENT_ID, p).catch(() => {}); }}
            onResetProfile={(blank) => { bumpProfile(blank); api.saveStudent(STUDENT_ID, blank).catch(() => {}); }} />}
          {view === "courses" && <Courses onOpen={setDetailId} studentId={STUDENT_ID} profile={profile} initialTrackId={courseTrackId} />}
          {view === "info" && <Info profileInterests={profile.interests} />}
          {view === "dashboard" && <Dashboard profile={profile} saved={saved} recs={recs} onGo={setView} />}
          {view === "majors" && <Majors profile={profile} studentId={STUDENT_ID} onOpen={setDetailId} onToggleSave={toggleSave} savedIds={savedIds} />}
          {view === "strategy" && <Strategy studentId={STUDENT_ID} profile={profile} onGo={setView} />}

          {view === "matches" && (
            <Matches
              profile={profile} recs={recs} loading={loading} err={err}
              savedIds={savedIds} onOpen={setDetailId} onToggleSave={toggleSave}
              onGoProfile={() => setView("profile")} onRerun={() => runRecommend(profile)}
              profileStale={profileStale} scanned={scanned} initialScenarioId={advisorTrackId}
              studentId={STUDENT_ID}
            />
          )}

          {view === "browse" && (
            <BrowseColleges profile={profile} onOpen={setDetailId}
              savedIds={savedIds} onToggleSave={toggleSave} />
          )}

          {view === "saved" && (
            <MyList studentId={STUDENT_ID} saved={saved} profile={profile} onOpen={setDetailId}
              onRemove={removeFromList} onClearAll={clearList} onGo={goTo} />
          )}

          {view === "programs" && <Programs studentId={STUDENT_ID} profile={profile} saved={saved} />}
          {view === "decisionPlan" && <DecisionPlan studentId={STUDENT_ID} profile={profile} saved={saved} collegeNames={collegeNames} onGo={goTo} />}
          {view === "applicationPathways" && <ApplicationPathways studentId={STUDENT_ID} saved={saved} collegeNames={collegeNames} onGo={goTo} focusCollegeId={view === "applicationPathways" ? focusCollegeId : null} />}
          {view === "essays" && <EssayCenter studentId={STUDENT_ID} saved={saved} collegeNames={collegeNames} onGo={goTo} focusCollegeId={view === "essays" ? focusCollegeId : null} />}

          {view === "applications" && <Applications studentId={STUDENT_ID} list={saved} collegeNames={collegeNames} profile={profile} onGo={setView} />}
          {view === "advisor" && <Advisor profile={profile} recs={recs} onRunMatches={(trackId) => {
            setAdvisorTrackId(trackId);
            // Run/re-run recommendations if none are loaded yet or the profile is
            // stale; runRecommend already switches to the Matches view. Otherwise
            // just open Matches (data is current). No scoring change.
            if (!recs.length || profileStale) runRecommend(profile);
            else setView("matches");
          }} onViewCoursePlan={(trackId) => { setCourseTrackId(trackId); setView("courses"); }} />}
        </ErrorBoundary>
      </main>

      {detailId && (
        <ErrorBoundary resetKey={detailId}>
          <CollegeDetail collegeId={detailId} profile={profile} fallbackName={collegeNames[detailId]} onClose={() => setDetailId(null)} onOpenOther={(id) => setDetailId(id)} />
        </ErrorBoundary>
      )}
    </div>
  );
}

function Landing({ onStart, onAbout }) {
  return (
    <div className="stack">
      <div className="banner">
        <div className="eyebrow">Built for the real thing</div>
        <h1 style={{ maxWidth: 18 + "ch", marginBottom: 10 }}>College planning on official data, not guesswork.</h1>
        <p className="lead">CollegeGene Navigator matches you to real U.S. colleges using federal College Scorecard data,
          maps majors to Bureau of Labor Statistics career outcomes, and helps your family track every deadline --
          with the source and date shown on every number.</p>
        <div className="row" style={{ marginTop: 18, gap: 10 }}>
          <button className="btn amber" onClick={onStart}>Start your profile -&gt;</button>
          <button className="btn ghost" onClick={onAbout} style={{ color: "#dbe6ef", borderColor: "#3a5670" }}>How it works</button>
        </div>
      </div>

      <div className="grid cols-3">
        {[
          ["Official college data", "Admission rates, cost, net price, graduation and earnings -- live from the U.S. Department of Education."],
          ["What each college wants", "For 28 seeded colleges: how they select, what they weight (from the Common Data Set), and their culture."],
          ["Your culture & selection fit", "See where your profile aligns with what a specific college actually rewards -- and where to strengthen."],
          ["What-if simulator", "SAT +100, add research, apply early -> watch your estimated category and fit shift in real time."],
          ["Top 10 / 20 / 30", "Ranked lists plus Reach / Target / Safety, estimated as ranges -- never false precision."],
          ["Application tracker", "Deadlines, forms, essays, and student + parent notes, exportable to CSV."],
        ].map(([t, d]) => (
          <div key={t} className="card pad">
            <div className="row spread" style={{ marginBottom: 8 }}>
              <h3>{t}</h3><SourceBadge level={t === "Honest labels" ? "verified" : "official"} />
            </div>
            <p className="note">{d}</p>
          </div>
        ))}
      </div>

      <div className="note" style={{ textAlign: "center" }}>
        Planning aid only, not a guarantee. <button className="link" onClick={onAbout}>Read how it works &amp; full disclaimer -&gt;</button>
      </div>
    </div>
  );
}
