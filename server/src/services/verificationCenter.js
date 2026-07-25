// verificationCenter.js -- Verification Center (Feature 1): one cross-college
// list of everything still unresolved, pulled together from data that
// already exists elsewhere in the app (essay_prompts, college_application_
// timeline_events + its existing conflict detector, college_application_
// requirements, discovered_programs, verification_checklists). Nothing here
// invents a new fact or a new verification concept -- it is a read-only
// aggregation across tables that each already track their own verification
// status, so a family doesn't have to open five different tabs to find out
// what's still unresolved. Categories with no real underlying data anywhere
// in the app (cost/NPC beyond what's on decision_plan_items, double-major
// rules as a distinct concept, direct-admit rules as a distinct concept
// beyond verification_checklists.direct_admission_checked) are explicitly
// listed as "not covered yet" in the response rather than shown as fake rows.
import { db } from "../db/database.js";
import { detectConflicts } from "./applicationTimeline.js";
import { DOUBLE_MAJOR_VERIFIED_STATUSES } from "./selectionContext.js";

export const VERIFICATION_ITEM_STATUSES = [
  "Verified", "Needs verification", "Conflicting sources", "Missing source", "User verified", "Not applicable",
];
export const VERIFICATION_PRIORITIES = ["High", "Medium", "Low"];

const VERIFIED_STATUSES = ["Official source verified", "User verified"];
function isVerifiedStatus(status) { return VERIFIED_STATUSES.includes(status); }

// Same saved-colleges + Decision Plan dedup used by Essay Center's coverage
// summary and findEssayPromptsForAllColleges -- one consistent college list
// across every cross-page feature in this app.
function collegesFor(studentId) {
  const saved = db.prepare("SELECT college_id, college_name FROM student_college_list WHERE student_id=?").all(studentId);
  const planned = db.prepare("SELECT college_id, college_name, item_id FROM decision_plan_items WHERE student_id=?").all(studentId);
  const seen = new Map();
  for (const r of [...saved, ...planned]) {
    const key = r.college_id || `name:${String(r.college_name || "").toLowerCase().trim()}`;
    if (!key || key === "name:") continue;
    if (!seen.has(key)) seen.set(key, { collegeId: r.college_id || null, collegeName: r.college_name || key, itemId: r.item_id || null });
    else if (r.item_id && !seen.get(key).itemId) seen.get(key).itemId = r.item_id;
  }
  return [...seen.values()];
}

export function buildVerificationCenter(studentId) {
  const colleges = collegesFor(studentId);
  const items = [];
  const addItem = (o) => items.push({
    college: o.college, collegeId: o.collegeId || null, programOrTrack: o.programOrTrack || null,
    issueType: o.issueType, status: o.status, sourceUrl: o.sourceUrl || null, lastChecked: o.lastChecked || null,
    actionNeeded: o.actionNeeded, priority: o.priority, relatedPage: o.relatedPage,
  });

  for (const c of colleges) {
    const label = c.collegeName;

    // -- Essay prompts needing verification --
    const prompts = c.collegeId
      ? db.prepare("SELECT * FROM essay_prompts WHERE student_id=? AND college_id=?").all(studentId, c.collegeId)
      : db.prepare("SELECT * FROM essay_prompts WHERE student_id=? AND college_id IS NULL AND LOWER(college_name)=LOWER(?)").all(studentId, c.collegeName);
    const unverifiedPrompts = prompts.filter((p) => !isVerifiedStatus(p.verification_status));
    if (!prompts.length) {
      addItem({ college: label, collegeId: c.collegeId, issueType: "Essay prompts needing verification", status: "Missing source",
        actionNeeded: "No essay prompts tracked yet. Open Essay Center and use \"Find essay requirements.\"",
        priority: "Medium", relatedPage: "essays" });
    } else if (unverifiedPrompts.length) {
      addItem({ college: label, collegeId: c.collegeId, issueType: "Essay prompts needing verification", status: "Needs verification",
        sourceUrl: unverifiedPrompts[0].source_url, lastChecked: unverifiedPrompts[0].last_checked,
        actionNeeded: `${unverifiedPrompts.length} of ${prompts.length} essay prompt(s) still need verification against the official application portal.`,
        priority: "Medium", relatedPage: "essays" });
    }

    // -- Application deadlines needing verification + conflicting dates --
    const timelineRows = c.collegeId
      ? db.prepare("SELECT * FROM college_application_timeline_events WHERE student_id=? AND college_id=?").all(studentId, c.collegeId)
      : [];
    const deadlineRows = timelineRows.filter((t) => t.event_date);
    if (!deadlineRows.length) {
      addItem({ college: label, collegeId: c.collegeId, issueType: "Application deadlines needing verification", status: "Missing source",
        actionNeeded: "No application timeline on file yet. Open Application Timeline and populate dates.",
        priority: "High", relatedPage: "timeline" });
    } else {
      const unverifiedDeadlines = deadlineRows.filter((t) => !isVerifiedStatus(t.verification_status));
      if (unverifiedDeadlines.length) {
        addItem({ college: label, collegeId: c.collegeId, issueType: "Application deadlines needing verification", status: "Needs verification",
          sourceUrl: unverifiedDeadlines[0].source_url, lastChecked: unverifiedDeadlines[0].last_checked,
          actionNeeded: `${unverifiedDeadlines.length} deadline(s) still need verification.`,
          priority: "High", relatedPage: "timeline" });
      }
    }
    if (c.collegeId) {
      for (const cf of detectConflicts(studentId, c.collegeId)) {
        addItem({ college: label, collegeId: c.collegeId, programOrTrack: cf.applicationRound, issueType: "Colleges with conflicting dates or conflicting sources",
          status: "Conflicting sources", actionNeeded: cf.notice, priority: "High", relatedPage: "timeline" });
      }
    }

    // -- Application platform + honors/scholarship application requirement --
    const reqRows = c.collegeId
      ? db.prepare("SELECT * FROM college_application_requirements WHERE student_id=? AND college_id=?").all(studentId, c.collegeId)
      : [];
    const primaryReq = reqRows.find((r) => !r.program_label) || reqRows[0] || null;
    if (!primaryReq) {
      addItem({ college: label, collegeId: c.collegeId, issueType: "Application platform needing verification", status: "Missing source",
        actionNeeded: "No application platform on file yet. Open Application Pathways and set it.",
        priority: "High", relatedPage: "pathways" });
      addItem({ college: label, collegeId: c.collegeId, issueType: "Colleges with no official admissions source checked", status: "Missing source",
        actionNeeded: "No verified admissions source recorded for this college yet.",
        priority: "Medium", relatedPage: "pathways" });
    } else if (!isVerifiedStatus(primaryReq.verification_status)) {
      addItem({ college: label, collegeId: c.collegeId, issueType: "Application platform needing verification", status: "Needs verification",
        sourceUrl: primaryReq.source_url, lastChecked: primaryReq.last_checked,
        actionNeeded: "Confirm the application platform on the official college site.",
        priority: "Medium", relatedPage: "pathways" });
    }
    for (const r of reqRows) {
      const flags = [];
      if (r.honors_app_required === "Yes") flags.push("Honors");
      if (r.scholarship_app_required === "Yes") flags.push("Scholarship");
      if (flags.length && !isVerifiedStatus(r.verification_status)) {
        addItem({ college: label, collegeId: c.collegeId, programOrTrack: r.program_label || flags.join(" / "),
          issueType: "Honors/scholarship deadlines needing verification", status: "Needs verification",
          sourceUrl: r.source_url, lastChecked: r.last_checked,
          actionNeeded: `${flags.join(" / ")} application requirement is marked "Yes" but not yet verified -- confirm the deadline on the official page.`,
          priority: "Medium", relatedPage: "pathways" });
      }
    }

    // -- Programs / major existence, sourced from discovered_programs --
    const programs = c.collegeId
      ? db.prepare("SELECT * FROM discovered_programs WHERE student_id=? AND college_id=?").all(studentId, c.collegeId)
      : [];
    const noSourcePrograms = programs.filter((p) => !p.source_url);
    const unverifiedPrograms = programs.filter((p) => p.source_url && !isVerifiedStatus(p.verification_status));
    if (noSourcePrograms.length) {
      addItem({ college: label, collegeId: c.collegeId, issueType: "Programs with no official source URL", status: "Missing source",
        actionNeeded: `${noSourcePrograms.length} program(s)/opportunit${noSourcePrograms.length === 1 ? "y" : "ies"} have no official source link yet.`,
        priority: "Low", relatedPage: "programs" });
    }
    if (unverifiedPrograms.length) {
      addItem({ college: label, collegeId: c.collegeId, issueType: "Major/program existence needing verification", status: "Needs verification",
        sourceUrl: unverifiedPrograms[0].source_url, lastChecked: unverifiedPrograms[0].last_checked,
        actionNeeded: `${unverifiedPrograms.length} program(s) still need verification against the official department page.`,
        priority: "Medium", relatedPage: "programs" });
    }

    // -- Direct-admit / double-major / special-program eligibility rules,
    // sourced from the Decision Plan's existing Verification Checklist
    // (verification_checklists) when this college has a Decision Plan item.
    if (c.itemId) {
      const checklist = db.prepare("SELECT * FROM verification_checklists WHERE student_id=? AND item_id=?").get(studentId, c.itemId);
      if (!checklist || !checklist.direct_admission_checked) {
        addItem({ college: label, collegeId: c.collegeId, issueType: "CS/engineering/business direct-admit rules needing verification", status: checklist ? "Needs verification" : "Missing source",
          actionNeeded: "Confirm on the official page whether this major/program requires direct admission or allows an internal transfer after enrollment.",
          priority: "Medium", relatedPage: "decision-plan" });
      }
      if (!checklist || !checklist.internal_transfer_rules_checked || !checklist.program_restrictions_checked) {
        addItem({ college: label, collegeId: c.collegeId, issueType: "Double-major rules needing verification", status: checklist ? "Needs verification" : "Missing source",
          actionNeeded: "Confirm double-major, minor, and internal-transfer restrictions on the official college site -- this app does not track major-combination rules automatically.",
          priority: "Low", relatedPage: "decision-plan" });
      }
      if (checklist && checklist.special_program_exists === "Unknown") {
        addItem({ college: label, collegeId: c.collegeId, issueType: "Special program eligibility needing verification", status: "Needs verification",
          actionNeeded: "Confirm eligibility for any special/honors program on the official page.",
          priority: "Low", relatedPage: "decision-plan" });
      }
    }

    // -- Double-major rules needing verification, specifically for colleges
    // selected from Double Major Search (student_college_list.primary_major /
    // decision_plan_items.primary_major). This is separate from the generic
    // checklist-based item above: it fires whenever the app actually has a
    // primary+secondary major pairing on file for this college and that
    // pairing's own double_major_verification_status isn't yet an official/
    // user-verified status -- i.e. exactly what Double Major Search produces.
    const listRow = c.collegeId
      ? db.prepare("SELECT primary_major, secondary_major, double_major_status, double_major_verification_status FROM student_college_list WHERE student_id=? AND college_id=?").get(studentId, c.collegeId)
      : null;
    const planRow = c.itemId
      ? db.prepare("SELECT primary_major, secondary_major, double_major_status, double_major_verification_status FROM decision_plan_items WHERE student_id=? AND item_id=?").get(studentId, c.itemId)
      : null;
    const dm = (planRow && planRow.primary_major) ? planRow : listRow;
    if (dm && dm.primary_major && dm.secondary_major && !DOUBLE_MAJOR_VERIFIED_STATUSES.includes(dm.double_major_verification_status)) {
      addItem({
        college: label, collegeId: c.collegeId, programOrTrack: `${dm.primary_major} + ${dm.secondary_major}`,
        issueType: "Double-major rules needing verification", status: "Needs verification",
        actionNeeded: `Verify double-major rules for ${label} -- confirm the ${dm.primary_major} + ${dm.secondary_major} pairing is actually allowed, any school-to-school restrictions, and direct-admit requirements with the college's official source.`,
        priority: "High", relatedPage: "programs",
      });
    }

    // -- Cost / Net Price Calculator, sourced from decision_plan_items (only
    // meaningful for colleges actually in the Decision Plan) --
    if (c.itemId) {
      const planItem = db.prepare("SELECT npc_completed, net_price_calculator_url FROM decision_plan_items WHERE student_id=? AND item_id=?").get(studentId, c.itemId);
      if (planItem && !planItem.npc_completed) {
        addItem({ college: label, collegeId: c.collegeId, issueType: "Cost / Net Price Calculator missing", status: "Missing source",
          sourceUrl: planItem.net_price_calculator_url || null,
          actionNeeded: "Run this college's official Net Price Calculator and record the estimate in Decision Plan.",
          priority: "Medium", relatedPage: "decision-plan" });
      }
    }
  }

  const byStatus = {};
  for (const it of items) byStatus[it.status] = (byStatus[it.status] || 0) + 1;
  const byPriority = {};
  for (const it of items) byPriority[it.priority] = (byPriority[it.priority] || 0) + 1;
  const byIssueType = {};
  for (const it of items) byIssueType[it.issueType] = (byIssueType[it.issueType] || 0) + 1;

  return {
    totalColleges: colleges.length,
    totalItems: items.length,
    byStatus, byPriority, byIssueType,
    items: items.sort((a, b) => (VERIFICATION_PRIORITIES.indexOf(a.priority) - VERIFICATION_PRIORITIES.indexOf(b.priority)) || a.college.localeCompare(b.college)),
    notice: "This list only ever reflects what's already tracked elsewhere in the app -- nothing here is a new fact about any college. Anything not \"Verified\" or \"User verified\" should be confirmed on the official source before you rely on it.",
  };
}
