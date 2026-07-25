// Majors.jsx — majors that fit the student, with why, careers, grad-school
// signal, and outlook.
import React, { useState, useEffect, useRef } from "react";
import { api } from "../lib/api.js";
import { Spinner, InlineSpinner, SourceBadge, SuccessNote, fmtUSD, fmtPct } from "./ui.jsx";
import { US_STATES } from "../lib/states.js";

export function Majors({ profile, studentId, onOpen, onToggleSave, savedIds }) {
  const [majors, setMajors] = useState([]);
  const [doubles, setDoubles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [majorQuery, setMajorQuery] = useState("");
  const [major2Query, setMajor2Query] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [majorColleges, setMajorColleges] = useState(null);
  const [comboMode, setComboMode] = useState(false);
  const [searchingMajor, setSearchingMajor] = useState(false);
  const [searchMeta, setSearchMeta] = useState(null);
  const [majorSearchError, setMajorSearchError] = useState(null);
  const [searchSuccessMsg, setSearchSuccessMsg] = useState(null);
  const [tab, setTab] = useState("search");   // "search" | "recommendations"
  // "size" matches the API's default order (largest schools first, from
  // College Scorecard enrollment data); "selectivity" re-sorts client-side by
  // admission rate (already fetched from Scorecard, just not shown before)
  // so the family can see which options are most/least selective at a glance.
  const [majorSort, setMajorSort] = useState("selectivity");
  // Deep search (up to 2,000 candidate colleges) is an explicit, opt-in,
  // advanced option -- it never runs automatically. Standard search (up to
  // 500 candidates) is the default for every search.
  const [deepSearch, setDeepSearch] = useState(false);
  // How many of the scored/verified colleges to display at once. Starts at
  // 20; "Show Top 30/50" jump straight to that size, "Load Next 25" adds 25
  // more, without re-running the search or re-scoring anything.
  const [displayCount, setDisplayCount] = useState(20);
  const searchRef = useRef(null);

  // Prefill the planner from the Profile's own Primary/Secondary major once,
  // so the double-major planner starts from what the family already told us
  // rather than a blank search box. Never overrides a user's own typing.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current) return;
    if (profile?.primaryMajor) {
      setMajorQuery(profile.primaryMajor);
      if (profile?.secondaryMajor) { setMajor2Query(profile.secondaryMajor); setComboMode(true); }
      prefilled.current = true;
    }
  }, [profile?.primaryMajor, profile?.secondaryMajor]);

  const resetSearch = () => {
    setMajorQuery(""); setMajor2Query(""); setStateFilter("");
    setComboMode(false); setMajorColleges(null); setSearchMeta(null); setMajorSearchError(null);
    setSearchSuccessMsg(null); setDisplayCount(20); setDeepSearch(false);
  };

  // Pick a combo -> jump to the search box so the user sees what was selected.
  const useCombo = (primary, partner) => {
    setComboMode(true); setMajorQuery(primary); setMajor2Query(partner);
    setMajorColleges(null); setSearchMeta(null); setMajorSearchError(null); setSearchSuccessMsg(null);
    setDisplayCount(20);
    setTab("search");
    setTimeout(() => searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };

  const runSearch = async () => {
    if (searchingMajor) return; // prevent duplicate clicks while a search is already running
    const q = majorQuery.trim();
    if (!q) return;
    const isCombo = comboMode && major2Query.trim();
    setSearchingMajor(true); setMajorColleges(null); setSearchMeta(null);
    setMajorSearchError(null); setSearchSuccessMsg(null); setDisplayCount(20);
    try {
      const r = isCombo
        ? await api.collegeMajorCombos(q, major2Query.trim(), stateFilter || undefined, { deep: deepSearch })
        : await api.collegesByMajor(q, stateFilter || undefined, { deep: deepSearch });
      setMajorColleges(r.colleges || []);
      setSearchMeta({ ...r, combo: !!isCombo });
      const found = (r.colleges || []).length;
      const pool = r.candidatePoolScanned ?? found;
      setSearchSuccessMsg(
        isCombo
          ? `Scored ${pool} candidate college${pool === 1 ? "" : "s"} — found ${found} offering both fields.`
          : `Scored ${pool} candidate college${pool === 1 ? "" : "s"} — found ${found} with a verified match.`
      );
    } catch (err) {
      // An API failure is NOT the same as "no colleges matched".
      setMajorSearchError(err?.message || "Could not check official program data.");
      setMajorColleges(null);
    } finally {
      setSearchingMajor(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    api.recommendMajors(profile).then((r) => { setMajors(r.majors || []); setDoubles(r.doubleMajors || []); }).catch(() => { setMajors([]); setDoubles([]); }).finally(() => setLoading(false));
  }, [profile]);

  // Selectivity rank -- computed client-side from admissionRate, which
  // College Scorecard already returns on every result but the UI never
  // showed. "Rank" here means admit-rate ordering among the colleges in
  // THIS result set, not a US News-style prestige ranking (this app doesn't
  // have a licensed prestige dataset, so it doesn't invent one).
  const sortedMajorColleges = (() => {
    if (!majorColleges) return null;
    const withRate = majorColleges.filter((c) => c.admissionRate != null);
    const withoutRate = majorColleges.filter((c) => c.admissionRate == null);
    if (majorSort === "selectivity") {
      const ranked = [...withRate].sort((a, b) => a.admissionRate - b.admissionRate);
      return [...ranked.map((c, i) => ({ ...c, selectivityRank: i + 1 })), ...withoutRate];
    }
    // "size" (API default order) -- still attach rank numbers so the badge
    // is available in either sort mode, just computed against the same
    // admit-rate ordering rather than reordering the visible list.
    const rankMap = new Map([...withRate].sort((a, b) => a.admissionRate - b.admissionRate).map((c, i) => [c.id, i + 1]));
    return majorColleges.map((c) => ({ ...c, selectivityRank: rankMap.get(c.id) || null }));
  })();

  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Majors for you</div>
        <h1>Majors that fit your profile</h1>
        <p className="lead">Ranked from your interests, strengths, and career goals — each with where it leads and
          whether it typically needs graduate school. Based on official BLS career data.</p>
      </div>

      <div className="row wrap" style={{ gap: 6 }}>
        <button className={`btn sm ${tab === "search" ? "primary" : "ghost"}`} onClick={() => setTab("search")}>
          Find colleges by major
        </button>
        <button className={`btn sm ${tab === "recommendations" ? "primary" : "ghost"}`} onClick={() => setTab("recommendations")}>
          Major recommendations for you
        </button>
      </div>

      {tab === "search" && !loading && (
        doubles.length > 0 ? (
          <div className="card pad">
            <h3 style={{ marginBottom: 6 }}>Double-major &amp; combination ideas</h3>
            <p className="note" style={{ marginBottom: 12 }}>Strong pairings for your profile. The <strong>Courses</strong> tab shows which colleges actually offer these combinations (e.g. MIT 6-14, Penn M&amp;T, Georgia Tech CS Threads). Use the search below to check which colleges offer both fields.</p>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
              {doubles.map((d) => (
                <div key={d.combo} className="card pad" style={{ background: "var(--paper-2)" }}>
                  <div className="row spread">
                    <strong style={{ fontSize: 14 }}>{d.combo}</strong>
                    <span className="pill" style={{ background: d.strength === "Strong" ? "var(--safety-b)" : "var(--target-b)" }}>{d.strength}</span>
                  </div>
                  <p className="note" style={{ marginTop: 6 }}>{d.why}</p>
                  <button className="link" style={{ marginTop: 6 }}
                    onClick={() => useCombo(d.primary, d.partner)}>
                    Find colleges offering both →
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card pad">
            <h3 style={{ marginBottom: 6 }}>Double-major &amp; combination ideas</h3>
            <p className="note">Add at least one intended major to your Profile to see suggested double-major pairings.</p>
          </div>
        )
      )}

      {tab === "search" && (
      <div className="card pad" ref={searchRef}>
        <div className="row spread">
          <label className="lbl">{comboMode ? "Double-Major Planner" : "Single-Major Planner"}</label>
          <div className="row" style={{ gap: 6 }}>
            <span className={`chip ${!comboMode ? "on" : ""}`} onClick={() => setComboMode(false)}>Single major</span>
            <span className={`chip ${comboMode ? "on" : ""}`} onClick={() => setComboMode(true)}>Double major</span>
            <button className="btn ghost sm" onClick={resetSearch}>Reset</button>
          </div>
        </div>
        {comboMode && (
          <div className="disclaimer" style={{ marginTop: 8, marginBottom: 0 }}>
            Do not assume a double major is possible just because a college offers both fields separately. Colleges
            differ widely in whether double majors are allowed, capped, require separate applications, or need
            special permission -- always confirm the actual policy with the college's advising office or catalog.
          </div>
        )}
        <div className="row wrap" style={{ gap: 8, marginTop: 8 }}>
          <input className="inp" style={{ flex: 1, minWidth: 180 }} value={majorQuery} placeholder="Major 1 (e.g. Computer Science)"
            onChange={(e) => setMajorQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
          {comboMode && (
            <input className="inp" style={{ flex: 1, minWidth: 180 }} value={major2Query} placeholder="Major 2 (e.g. Finance)"
              onChange={(e) => setMajor2Query(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
          )}
          <input className="inp" style={{ width: 90 }} value={stateFilter} placeholder="State" maxLength={2}
            onChange={(e) => setStateFilter(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
          <button className="btn primary sm" onClick={runSearch} disabled={searchingMajor}>
            {searchingMajor ? <><InlineSpinner />Searching…</> : "Search"}
          </button>
        </div>
        <div className="row wrap" style={{ gap: 6, marginTop: 8, alignItems: "center" }}>
          <span className="note" style={{ fontWeight: 600 }}>State:</span>
          <select className="inp" style={{ width: "auto" }} value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="">Nationwide (all states)</option>
            {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </div>
        <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
          {majors.slice(0, 4).map((m) => (
            <span key={m.name} className="chip" onClick={() => { setMajorQuery(m.name); }}>{m.name}</span>
          ))}
        </div>

        <div style={{ marginTop: 10 }}>
          <label className="row" style={{ gap: 8, alignItems: "flex-start", cursor: "pointer" }}>
            <input type="checkbox" checked={deepSearch} disabled={searchingMajor}
              onChange={(e) => setDeepSearch(e.target.checked)} style={{ marginTop: 2 }} />
            <span className="note" style={{ fontSize: 12 }}>
              <strong>Deep search (advanced)</strong> — candidate pool searched, up to 2,000 colleges instead of 500.
              <span style={{ display: "block", color: "var(--muted)", fontSize: 11, marginTop: 2 }}>
                Deep search may take longer. Results still need official verification. Standard search (up to 500
                candidates) is enough for most searches.
              </span>
            </span>
          </label>
        </div>

        {searchingMajor && (
          <div style={{ marginTop: 10 }}>
            <Spinner label={comboMode
              ? "Searching double-major options and checking primary and secondary major fit…"
              : "Searching colleges and checking official program data…"} />
          </div>
        )}

        {searchSuccessMsg && !searchingMajor && !majorSearchError && <SuccessNote>{searchSuccessMsg}</SuccessNote>}

        {majorSearchError && !searchingMajor && (
          <div className="disclaimer" style={{ borderLeftColor: "var(--reach)", marginTop: 10 }}>
            <strong>Could not check official program data right now:</strong> {majorSearchError}
            <div className="note" style={{ marginTop: 4 }}>This is an API/connection problem — not a statement that no colleges match.</div>
            <button className="link" style={{ marginTop: 4 }} onClick={runSearch}>Try again</button>
          </div>
        )}

        {majorColleges && !searchingMajor && !majorSearchError && (
          <div style={{ marginTop: 12 }}>
            {searchMeta?.cipCodesUsed && (
              <div className="note" style={{ marginBottom: 6 }}>
                Source: {searchMeta.source || "College Scorecard"} · CIP codes used: {Array.isArray(searchMeta.cipCodesUsed) ? searchMeta.cipCodesUsed.join(", ") : [searchMeta.cipCodesUsed.major1, searchMeta.cipCodesUsed.major2].filter(Boolean).flat().join(", ")}
                {searchMeta.candidatePoolScanned != null
                  ? ` · Candidate pool searched: ${searchMeta.candidatePoolScanned}${searchMeta.mode === "deep" ? " (deep search)" : ""}`
                  : (searchMeta.rawResultCount != null ? ` · ${searchMeta.rawResultCount} colleges checked` : "")}
              </div>
            )}
            {searchMeta?.partial && (
              <div className="note" style={{ color: "var(--amber)", marginBottom: 6 }}>
                This search stopped before checking every possible college (a very large or slow result set). Try
                narrowing with a state filter, or use Deep search for a larger candidate pool.
              </div>
            )}
            {searchMeta?.deepSearchWarning && (
              <div className="note" style={{ color: "var(--muted)", marginBottom: 6 }}>{searchMeta.deepSearchWarning}</div>
            )}
            {!majorColleges.length ? (
              <div className="empty">
                {stateFilter
                  ? `No verified matches in ${stateFilter}. Try nationwide.`
                  : "No colleges with a verified bachelor's program matched. Try a broader term."}
              </div>
            ) : (
              <>
                <div className="row spread wrap" style={{ marginBottom: 8, alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>
                    {searchMeta?.combo
                      ? `Colleges offering BOTH ${searchMeta.major1} and ${searchMeta.major2}`
                      : `Colleges offering ${searchMeta?.major || majorQuery}`}
                  </h3>
                  <div className="row" style={{ gap: 6, alignItems: "center" }}>
                    <span className="note">Sort:</span>
                    <span className={`chip ${majorSort === "selectivity" ? "on" : ""}`} onClick={() => setMajorSort("selectivity")}>Most selective first</span>
                    <span className={`chip ${majorSort === "size" ? "on" : ""}`} onClick={() => setMajorSort("size")}>Largest first</span>
                    <span className="note">{majorColleges.length} scored colleges</span>
                  </div>
                </div>
                {searchMeta?.combo && (
                  <div className="disclaimer" style={{ borderLeftColor: "var(--amber)", marginBottom: 8 }}>
                    These colleges offer both fields at bachelor's level according to official College Scorecard
                    program data. That is <strong>not</strong> the same as permission to declare a formal double
                    major — confirm double-major and dual-degree rules with each college's catalog or advising office.
                  </div>
                )}
              </>
            )}
            {majorColleges.length > 0 && (
              <div className="stack" style={{ gap: 8 }}>
                <div className="note" style={{ fontSize: 11 }}>
                  "Selectivity rank" is this list's colleges ordered by admission rate (most selective = #1) from College Scorecard —
                  not a US News-style prestige ranking. Colleges with no admission-rate data on file are shown unranked.
                </div>
                <div className="note" style={{ fontWeight: 600 }}>
                  Showing 1–{Math.min(displayCount, sortedMajorColleges.length)} of {sortedMajorColleges.length} scored colleges
                </div>
                {sortedMajorColleges.slice(0, displayCount).map((c) => (
                  <MajorCollegeCard key={c.id} c={c} profile={profile} studentId={studentId} searchMeta={searchMeta}
                    onOpen={onOpen} onToggleSave={onToggleSave} savedIds={savedIds} />
                ))}
                <div className="row wrap" style={{ gap: 6, marginTop: 4 }}>
                  {displayCount < 30 && sortedMajorColleges.length > displayCount && (
                    <button className="btn ghost sm" onClick={() => setDisplayCount(30)}>Show Top 30</button>
                  )}
                  {displayCount < 50 && sortedMajorColleges.length > displayCount && (
                    <button className="btn ghost sm" onClick={() => setDisplayCount(50)}>Show Top 50</button>
                  )}
                  {sortedMajorColleges.length > displayCount && (
                    <button className="btn ghost sm" onClick={() => setDisplayCount((n) => n + 25)}>Load Next 25</button>
                  )}
                  {displayCount > 20 && (
                    <button className="btn ghost sm" onClick={() => setDisplayCount(20)}>Reset to Top 20</button>
                  )}
                </div>
              </div>
            )}
            {searchMeta?.disclaimer && <div className="note" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>{searchMeta.disclaimer}</div>}
          </div>
        )}
      </div>

      )}

      {tab === "recommendations" && (
        loading ? <div className="card pad"><Spinner label="Matching majors to your profile…" /></div>
      : !majors.length ? <div className="empty">Add some interests and career goals to your profile to see major recommendations.</div>
      : (
        <div className="stack">
          {majors.map((m, i) => (
            <div key={m.name} className="card pad">
              <div className="row spread" style={{ alignItems: "flex-start" }}>
                <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                  <span className="mono" style={{ color: "var(--amber)", fontWeight: 600 }}>#{i + 1}</span>
                  <div>
                    <h3 style={{ marginBottom: 3 }}>{m.name}</h3>
                    <p className="note">{m.blurb}</p>
                  </div>
                </div>
                {m.gradSchool && <span className="pill" style={{ background: "var(--target-b)" }}>Often needs grad school</span>}
              </div>

              <p className="note" style={{ margin: "10px 0", color: "var(--ink-900)" }}>{m.why}</p>

              {m.careers?.length > 0 && (
                <div>
                  <div className="note" style={{ fontWeight: 600, marginBottom: 6 }}>Where it can lead</div>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>
                    {m.careers.map((c) => (
                      <div key={c.title || c.name} className="card pad" style={{ background: "var(--paper-2)", padding: 10 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.title || c.name}</div>
                        <div className="note">
                          {c.medianPay ? `Median ${fmtUSD(c.medianPay)}` : ""}
                          {c.growth ? ` · ${c.growth > 0 ? "+" : ""}${c.growth}% growth` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="row" style={{ gap: 8, marginTop: 10 }}>
                <SourceBadge level="official">BLS</SourceBadge>
                <span className="note">Career figures are official BLS estimates; outcomes vary.</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// A college card in the Majors search results, with an on-demand
// "Evaluate against my profile" action (parity with Browse Colleges).
// Preserves all existing program/combo display; only adds the evaluate control.
function MajorCollegeCard({ c, profile, studentId, searchMeta, onOpen, onToggleSave, savedIds }) {
  const [scored, setScored] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalErr, setEvalErr] = useState(null);
  const [comboSaveMsg, setComboSaveMsg] = useState(null);
  const [comboSaving, setComboSaving] = useState(false);
  const [listMsg, setListMsg] = useState(null);
  const isCombo = !!searchMeta?.combo;

  const evaluate = async () => {
    setEvaluating(true); setEvalErr(null);
    try {
      const r = await api.evaluateCollege(c.id, profile);
      setScored(r.scored);
    } catch (e) { setEvalErr(e.message || "Couldn't evaluate."); }
    finally { setEvaluating(false); }
  };

  const saveComboToDecisionPlan = async () => {
    if (!studentId || comboSaving) return; // guard against duplicate clicks
    setComboSaving(true); setComboSaveMsg(null);
    try {
      await api.addDecisionItem(studentId, {
        collegeId: c.id, collegeName: c.name,
        careerTrack: profile?.preferredScenarioId || null,
        programVerificationStatus: "Needs manual verification",
        primaryMajor: searchMeta.major1, secondaryMajor: searchMeta.major2,
        doubleMajorStatus: c.doubleMajorStatus || "Needs official verification",
        doubleMajorVerificationStatus: c.doubleMajorVerificationStatus || "Needs manual verification",
        doubleMajorNotes: "Both fields exist here per College Scorecard, but the double-major policy is not yet verified.",
        sourceContext: "Selected from Double Major Search",
        notes: `Considering a double major: ${searchMeta.major1} + ${searchMeta.major2}. Both fields exist here per College Scorecard, but the double-major policy is not yet verified -- confirm with the college's advising office.`,
        actionNeeded: "Verify double-major rules and school-to-school restrictions with the college's advising office or catalog.",
      });
      setComboSaveMsg("Saved to Decision Plan as a double-major consideration. Double-major path needs official verification.");
    } catch (e) {
      setComboSaveMsg(`Could not save: ${e.message}`);
    } finally { setComboSaving(false); }
  };

  // "+ List" for a double-major result: on first save, this IS the add (goes
  // through the normal toggle). If the college is already on the list (saved
  // from anywhere else), clicking here should ADD this pathway to the
  // existing card, never remove it or create a second card for the same
  // college -- forceAdd=true guarantees that.
  const addDoubleMajorOption = async () => {
    setListMsg(null);
    try {
      await onToggleSave(
        { college: { id: c.id, name: c.name, city: c.city, state: c.state }, admission: null, overall: null },
        {
          context: "Selected from Double Major Search",
          primaryMajor: searchMeta.major1, secondaryMajor: searchMeta.major2,
          doubleMajorLabel: `${searchMeta.major1} + ${searchMeta.major2}`,
          doubleMajorStatus: c.doubleMajorStatus || "Needs official verification",
          doubleMajorVerificationStatus: c.doubleMajorVerificationStatus || "Needs manual verification",
        },
        true // forceAdd -- merge in this pathway, don't toggle off an existing save
      );
      setListMsg("Added as double-major option.");
    } catch (e) {
      setListMsg(`Could not add: ${e.message}`);
    }
  };

  return (
    <div className="card pad" style={{ background: "var(--paper-2)" }}>
      <div className="row spread wrap" style={{ alignItems: "flex-start" }}>
        <strong>{c.name}</strong>
        <div className="row wrap" style={{ gap: 6, alignItems: "center" }}>
          {c.selectivityRank != null && <span className="pill" style={{ background: "var(--amber-b)" }}>Selectivity #{c.selectivityRank}</span>}
          {c.admissionRate != null && <span className="pill">Admit {fmtPct(c.admissionRate)}</span>}
          <span className="note">{[c.city, c.state].filter(Boolean).join(", ")}</span>
        </div>
      </div>
      {/* single-major matches */}
      {c.matchingPrograms && (
        <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
          {c.matchingPrograms.map((p) => (
            <span key={p.cipCode} className="pill" style={{ background: p.matchType === "exact" ? "var(--safety-b)" : "var(--target-b)" }}>
              {p.title} · CIP {p.cipCode} · {p.matchType}
            </span>
          ))}
        </div>
      )}
      {/* combo matches */}
      {c.offersMajor1 != null && (
        <div style={{ marginTop: 8 }}>
          <div className="row wrap" style={{ gap: 6 }}>
            <span className="pill" style={{ background: "var(--safety-b)" }}>Offers both fields ✓</span>
            {c.doubleMajorStatus && <span className="pill" style={{ background: "var(--target-b)" }}>{c.doubleMajorStatus}</span>}
          </div>
          <div className="note" style={{ marginTop: 6, fontWeight: 600, color: "var(--amber)" }}>
            Double-major path needs official verification.
          </div>
          <div className="grid cols-2" style={{ gap: 8, marginTop: 8 }}>
            <div>
              <div className="note" style={{ fontWeight: 600 }}>{searchMeta.major1}</div>
              {(c.matchingMajor1Programs || []).slice(0, 3).map((p) => (
                <div key={p.cipCode} className="note" style={{ fontSize: 11 }}>• {p.title} (CIP {p.cipCode})</div>
              ))}
            </div>
            <div>
              <div className="note" style={{ fontWeight: 600 }}>{searchMeta.major2}</div>
              {(c.matchingMajor2Programs || []).slice(0, 3).map((p) => (
                <div key={p.cipCode} className="note" style={{ fontSize: 11 }}>• {p.title} (CIP {p.cipCode})</div>
              ))}
            </div>
          </div>
        </div>
      )}
      {c.relatedAvailablePrograms && c.relatedAvailablePrograms.length > 0 && (
        <div className="note" style={{ marginTop: 6 }}>Also available: {c.relatedAvailablePrograms.slice(0, 6).join(", ")}</div>
      )}
      {c.warning && <div className="note" style={{ marginTop: 6, color: "var(--muted)", fontSize: 11 }}>{c.warning}</div>}

      {scored && (
        <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
          <span className="pill" style={{ background: "var(--amber-b)" }}>
            Estimated fit based on your profile: {scored.overall ?? "—"}
          </span>
          {scored.coarseCategory && <span className="pill">{scored.coarseCategory}</span>}
        </div>
      )}
      {evalErr && <div className="note" style={{ marginTop: 6, color: "var(--reach)" }}>{evalErr}</div>}
      {comboSaveMsg && <div className="note" style={{ marginTop: 6, color: "var(--safety)" }}>{comboSaveMsg}</div>}
      {listMsg && <div className="note" style={{ marginTop: 6, color: "var(--safety)" }}>{listMsg}</div>}

      <div className="row" style={{ gap: 10, marginTop: 6 }}>
        <button className="link" onClick={() => onOpen && onOpen(c.id)}>View college →</button>
        {!scored && (
          <button className="link" onClick={evaluate} disabled={evaluating}>
            {evaluating ? "Evaluating…" : "Evaluate against my profile"}
          </button>
        )}
        {c.offersMajor1 != null && studentId && (
          <button className="link" onClick={saveComboToDecisionPlan} disabled={comboSaving}>
            {comboSaving ? "Saving to Decision Plan…" : "Save as double-major consideration →"}
          </button>
        )}
        {onToggleSave && !isCombo && (
          <button className="link" onClick={() => onToggleSave(
            { college: { id: c.id, name: c.name, city: c.city, state: c.state }, admission: null, overall: null },
            { context: "Selected from Single Major Search" }
          )}>
            {savedIds?.has(c.id) ? "Saved ✓" : "+ List"}
          </button>
        )}
        {onToggleSave && isCombo && !savedIds?.has(c.id) && (
          <button className="link" onClick={() => onToggleSave(
            { college: { id: c.id, name: c.name, city: c.city, state: c.state }, admission: null, overall: null },
            {
              context: "Selected from Double Major Search",
              primaryMajor: searchMeta.major1, secondaryMajor: searchMeta.major2,
              doubleMajorLabel: `${searchMeta.major1} + ${searchMeta.major2}`,
              doubleMajorStatus: c.doubleMajorStatus || "Needs official verification",
              doubleMajorVerificationStatus: c.doubleMajorVerificationStatus || "Needs manual verification",
            }
          )}>+ List</button>
        )}
        {onToggleSave && isCombo && savedIds?.has(c.id) && (
          <button className="link" onClick={addDoubleMajorOption}>Add as double-major option →</button>
        )}
      </div>
    </div>
  );
}
