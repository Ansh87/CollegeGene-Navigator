// stem.js — STEM-strength ratings for a curated set of colleges, used to power a
// "Top STEM colleges" ranking. Ratings reflect widely-recognized strength of
// undergraduate STEM (CS/engineering/science) programs based on reputation,
// research, and outcomes. These are editorial rankings, clearly labeled as such
// — NOT an official government dataset. Live outcome data (earnings, grad rate)
// still comes from College Scorecard and is shown alongside.
//
// score: 0-100 STEM strength (editorial). specialties: notable STEM areas.

const S = (id, name, score, tier, specialties) => ({ id, name, score, tier, specialties });

// Curated Top-30 STEM colleges (national). Ordered by editorial STEM strength.
export const TOP_STEM = [
  S("166683", "MIT", 100, "Elite STEM", ["CS", "AI", "EECS", "all engineering", "physics"]),
  S("110404", "Caltech", 99, "Elite STEM", ["physics", "engineering", "CS", "research"]),
  S("243744", "Stanford", 98, "Elite STEM", ["CS", "AI", "engineering", "entrepreneurship"]),
  S("110635", "UC Berkeley", 97, "Elite STEM", ["EECS", "CS", "engineering", "research"]),
  S("201645", "Carnegie Mellon", 96, "Elite STEM", ["CS", "AI/ML", "robotics", "software"]),
  S("145637", "UIUC", 94, "Top STEM", ["CS", "engineering", "computer engineering"]),
  S("139755", "Georgia Tech", 94, "Top STEM", ["CS", "all engineering", "co-op"]),
  S("170976", "University of Michigan", 92, "Top STEM", ["engineering", "CS", "research"]),
  S("228778", "UT Austin", 91, "Top STEM", ["CS (Turing)", "engineering"]),
  S("162928", "Johns Hopkins", 91, "Top STEM", ["biomedical engineering", "research", "public health"]),
  S("190415", "Cornell", 91, "Top STEM", ["CS", "engineering", "applied sciences"]),
  S("215062", "UPenn", 89, "Top STEM", ["CS (SEAS)", "bioengineering", "M&T"]),
  S("243780", "Purdue", 89, "Top STEM", ["engineering", "CS", "aerospace"]),
  S("166027", "Harvard", 88, "Top STEM", ["CS", "applied math", "research"]),
  S("190150", "Columbia", 87, "Top STEM", ["CS (SEAS)", "engineering", "data science"]),
  S("147767", "Northwestern", 86, "Strong STEM", ["engineering (McCormick)", "CS", "materials"]),
  S("198419", "Duke", 86, "Strong STEM", ["engineering (Pratt)", "CS", "biomedical"]),
  S("110662", "UCLA", 86, "Strong STEM", ["CS", "engineering (Samueli)"]),
  S("130794", "Yale", 84, "Strong STEM", ["CS", "biomedical", "applied physics"]),
  S("186131", "Princeton", 88, "Top STEM", ["engineering (B.S.E.)", "CS", "physics"]),
  S("123961", "USC", 83, "Strong STEM", ["CS (Viterbi)", "engineering", "games"]),
  S("217156", "Brown", 82, "Strong STEM", ["CS", "applied math", "engineering"]),
  S("182670", "Dartmouth", 80, "Strong STEM", ["engineering (Thayer)", "CS"]),
  S("186584", "Stevens Institute of Technology", 80, "Strong STEM", ["engineering", "CS", "co-op"]),
  S("186867", "NJIT", 76, "Solid STEM", ["engineering", "CS", "architecture"]),
  S("163286", "University of Maryland", 85, "Strong STEM", ["CS", "cybersecurity", "engineering"]),
  S("214777", "Penn State", 82, "Strong STEM", ["engineering", "CS", "materials"]),
  S("186380", "Rutgers-New Brunswick", 78, "Solid STEM", ["CS", "engineering", "data science"]),
  S("190150", "Columbia University", 90, "Top STEM", ["CS", "engineering", "data science"]),
  S("130794", "Yale University", 84, "Strong STEM", ["CS", "biomedical", "applied physics"]),
  S("186131", "Princeton University", 92, "Top STEM", ["CS", "engineering", "physics", "ORFE"]),
  S("190415", "Cornell University", 91, "Top STEM", ["CS", "engineering", "applied sciences"]),
  S("215062", "University of Pennsylvania", 89, "Top STEM", ["CS (SEAS)", "bioengineering", "M&T"]),
  S("166027", "Harvard University", 88, "Top STEM", ["CS", "applied math", "research"]),
  S("162928", "Johns Hopkins University", 90, "Top STEM", ["biomedical engineering", "CS", "research"]),
  S("147767", "Northwestern University", 84, "Strong STEM", ["engineering (McCormick)", "CS", "materials"]),
  S("198419", "Duke University", 85, "Strong STEM", ["engineering (Pratt)", "CS", "biomedical"]),
  S("110662", "UCLA", 86, "Strong STEM", ["CS", "engineering (Samueli)"]),
  S("123961", "USC", 83, "Strong STEM", ["CS", "engineering (Viterbi)", "games"]),
  S("170976", "University of Michigan", 90, "Top STEM", ["CS", "engineering", "research"]),
  S("228778", "UT Austin", 88, "Top STEM", ["CS (Turing)", "engineering"]),
  S("240444", "UW–Madison", 82, "Strong STEM", ["CS", "engineering", "data science"]),
  S("240727", "Purdue University", 87, "Top STEM", ["engineering", "CS", "aerospace"]),
  S("110644", "UC San Diego", 84, "Strong STEM", ["CS", "engineering (Jacobs)", "bioengineering"]),
  S("110653", "UC Irvine", 80, "Solid STEM", ["CS", "engineering", "data science"]),
  S("445188", "UC Santa Barbara", 81, "Strong STEM", ["CS", "engineering", "physics"]),
  S("139959", "Emory University", 76, "Solid STEM", ["CS", "biology", "pre-health"]),
  S("221999", "Vanderbilt University", 82, "Strong STEM", ["engineering", "CS", "biomedical"]),
  S("144050", "University of Chicago", 85, "Strong STEM", ["CS", "math", "physics"]),
  S("199120", "UNC Chapel Hill", 79, "Solid STEM", ["CS", "data science", "biology"]),
  S("100751", "University of Alabama", 72, "Solid STEM", ["engineering", "CS"]),
  S("104179", "Arizona State University", 74, "Solid STEM", ["engineering (Fulton)", "CS"]),
].sort((a, b) => b.score - a.score);

const BY_ID = new Map(TOP_STEM.map((c) => [c.id, c]));
export function stemFor(id) { return BY_ID.get(String(id)) || null; }
export function stemRank(id) {
  const i = TOP_STEM.findIndex((c) => c.id === String(id));
  return i === -1 ? null : i + 1;
}
