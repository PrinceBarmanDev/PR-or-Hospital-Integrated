/* ============ PR OR HOSPITAL - CLEAN JS - FINAL ============ */
const API_BASE = "https://pr-or-hospital-integrated.onrender.com";
const CIRCUMFERENCE = 2 * Math.PI * 82;
const $ = (id) => document.getElementById(id);
const slider = $("weight-slider");
const targetInput = $("target-weight");
const runButton = $("run-prediction");
let animatedProb = 0;
let lastRecovery = { score: 75, verdict: "READY", risk: 0 };
let lastPopupData = null;

const safe = (id, fn) => { const el = $(id); if (el && fn) fn(el); return el; };
const liftMap = { squat: "Squat", bench: "Bench", deadlift: "Deadlift" };
// Helper: empty string = no value, NOT 0
const getNum = (id) => { const v = $(id)?.value; if (v === "" || v === null || v === undefined) return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const markEmpty = (id) => { const el = $(id); if (el) { el.style.borderColor = "#ff3b30"; el.style.boxShadow = "0 0 0 3px rgba(255,59,48,.25)"; el.focus(); setTimeout(()=>{ el.style.boxShadow=""; }, 2000); } };
const clearMark = (id) => { const el = $(id); if (el) { el.style.borderColor = ""; el.style.boxShadow = ""; } };

// ---------- RECOVERY SCORE ----------
function updateRecovery() {
  const sleep = getNum("sleep-hours");
  const sore = getNum("soreness");
  const rest = getNum("rest-days");
  const energy = getNum("energy");
  // If user hasn't typed anything yet - show waiting, not fake 75 score
  if (sleep === null && sore === null && rest === null && energy === null) {
    lastRecovery = { score: 0, verdict: "ENTER DETAILS", risk: 0 };
    safe("recovery-score", el => { el.textContent = "—"; el.style.color = "#fff"; });
    safe("recovery-verdict", el => { el.textContent = "ENTER DETAILS"; el.style.color = "#8a968a"; });
    safe("recovery-risk", el => { el.textContent = "—"; el.style.color = "#8a968a"; });
    safe("d-ready", el => { el.textContent = "—"; el.style.color = "#fff"; });
    return lastRecovery;
  }
  const s = sleep ?? 7;
  const so = sore ?? 5;
  const r = rest ?? 1;
  const e = energy ?? 7;

  let score = (Math.min(s, 9) / 9 * 35) + ((10 - so) / 9 * 30) + (Math.min(r, 3) / 3 * 15) + (e / 10 * 20);
  score = Math.max(0, Math.min(100, Math.round(score)));
  const verdict = score >= 75 ? "READY 🟢" : score >= 50 ? "CAUTION 🟡" : "TIRED 🔴";
  const risk = Math.max(0, Math.round(100 - score));
  lastRecovery = { score, verdict, risk };

  safe("recovery-score", el => { el.textContent = score + "/100"; el.style.color = score >= 75 ? "#b8ff00" : score >= 50 ? "#eab308" : "#ff3b30"; });
  safe("recovery-verdict", el => { el.textContent = verdict; el.style.color = score >= 75 ? "#b8ff00" : score >= 50 ? "#eab308" : "#ff3b30"; });
  safe("recovery-risk", el => { el.textContent = "+" + risk + "% RISK"; el.style.color = risk <= 25 ? "#b8ff00" : risk <= 50 ? "#eab308" : "#ff3b30"; });
  safe("d-ready", el => { el.textContent = score + "/100"; el.style.color = score >= 75 ? "#b8ff00" : score >= 50 ? "#eab308" : "#ff3b30"; });

  const sleepEl = $("sleep-hours"); if (sleepEl) sleepEl.style.borderColor = s < 5 ? "#ff3b30" : "#2b332b";
  const soreEl = $("soreness"); if (soreEl) soreEl.style.borderColor = so >= 8 ? "#ff3b30" : "#2b332b";
  return lastRecovery;
}

// ---------- SLIDER / WEIGHT ----------
function paintSlider() {
  if (!slider) return;
  const min = Number(slider.min), max = Number(slider.max), value = Number(slider.value);
  const pct = ((value - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, #ff3b30 0%, #ff3b30 ${pct}%, #2b332b ${pct}%, #2b332b 100%)`;
}
function updateWeight(value) {
  const weight = Math.min(1000, Math.max(1, Number(value) || 1));
  if (targetInput) targetInput.value = weight;
  if (slider) slider.value = Math.min(Number(slider.max), Math.max(Number(slider.min), weight));
  safe("target-weight-val", el => el.textContent = weight.toLocaleString(undefined, { maximumFractionDigits: 1 }));
  const prior = getNum("prior-success");
  safe("intensity-pct", el => el.textContent = prior !== null && prior > 0 ? `${(weight / prior * 100).toFixed(1)}% OF YOUR LAST BEST` : "ENTER YOUR LAST BEST");
  safe("d-target", el => el.textContent = weight + " kg");
  safe("d-pr", el => el.textContent = prior !== null ? prior + " kg" : "—");
  safe("d-sleep", el => el.textContent = getNum("sleep-hours") !== null ? getNum("sleep-hours") + " hrs" : "—");
  safe("d-sore", el => el.textContent = getNum("soreness") !== null ? getNum("soreness") + " / 10" : "—");
  safe("d-rest", el => el.textContent = getNum("rest-days") !== null ? getNum("rest-days") + " day" : "—");
  renderBarbell(weight);
  paintSlider();
}
function renderBarbell(totalKg) {
  const left = $("left-plates"), right = $("right-plates");
  if (!left || !right) return;
  left.replaceChildren(); right.replaceChildren();
  let perSide = Math.max(0, (totalKg - 20) / 2);
  const perSideStart = perSide;
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
  const summary = [];
  for (const kg of plates) {
    const count = Math.floor((perSide + 1e-6) / kg);
    if (!count) continue;
    summary.push(`${count}x${kg}`);
    perSide -= count * kg;
    for (let i = 0; i < count; i++) {
      for (const container of [left, right]) {
        const plate = document.createElement("div");
        plate.className = `plate plate-${String(kg).replace('.', '_')}`;
        plate.textContent = kg;
        container.appendChild(plate);
      }
    }
  }
  safe("plate-breakdown", el => el.textContent = summary.length ? `${summary.join(" + ")} KG / SIDE` : "20 KG BAR ONLY");
  safe("plate-per-side", el => el.textContent = perSideStart.toFixed(1) + " KG");
}
function setStatus(text, isError = false) {
  safe("api-status-tag", el => { el.textContent = text; el.style.color = isError ? "#ff6b63" : "#b8ff00"; });
}

// ---------- GAUGE ----------
function animateGauge(targetPct, failed) {
  const arc = $("gauge-arc");
  const label = $("failure-prob");
  if (!arc || !label) return;
  const start = animatedProb;
  const startTime = performance.now();
  const duration = 800;
  function frame(now) {
    const p = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = start + (targetPct - start) * eased;
    animatedProb = val;
    label.textContent = val.toFixed(1);
    arc.style.strokeDashoffset = (CIRCUMFERENCE * (1 - val / 100)).toFixed(2);
    arc.style.stroke = val >= 50 ? "#ff3b30" : val >= 30 ? "#eab308" : "#b8ff00";
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---------- BIG POPUP - SAME 5 OUTPUTS AS 03 ----------
function showPopup(failed, prob, advice) {
  const d = lastPopupData;
  if (!d) { $("result-popup")?.classList.add("show"); return; }
  const caution = prob >= 30 && prob < 50;
  const riskLabel = failed ? "HIGH" : caution ? "MEDIUM" : "LOW";
  safe("popup-prob", el => el.textContent = prob.toFixed(1));
  safe("popup-title", el => { el.textContent = failed ? "DON'T LIFT THIS" : caution ? "BE CAREFUL" : "GO FOR IT"; el.style.color = failed ? "#ff3b30" : caution ? "#eab308" : "#b8ff00"; });
  safe("popup-badge", el => { el.textContent = riskLabel + " RISK"; el.className = "lift-badge " + (failed ? "high" : caution ? "medium" : "low"); });
  safe("popup-date", el => el.textContent = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase());
  safe("popup-bar", el => { el.style.width = prob + "%"; el.style.background = failed ? "#ff3b30" : caution ? "#eab308" : "#b8ff00"; });
  safe("popup-complete", el => el.textContent = d.completePct.toFixed(0) + "%");
  safe("popup-complete-2", el => el.textContent = d.completePct.toFixed(0) + "%");
  safe("popup-risk", el => { el.textContent = riskLabel; el.style.color = failed ? "#ff3b30" : caution ? "#eab308" : "#b8ff00"; });
  safe("popup-risk-2", el => { el.textContent = riskLabel; el.style.color = failed ? "#ff3b30" : caution ? "#eab308" : "#b8ff00"; });
  safe("popup-safe", el => el.textContent = d.safeWeight + " kg");
  safe("popup-conf", el => el.textContent = d.conf + "%" + (d.confEstimated ? " (estimated)" : ""));
  safe("popup-pr-target", el => el.textContent = d.prior + " kg → " + d.target + " kg");
  safe("popup-sleep", el => el.textContent = d.sleep + " hrs");
  safe("popup-sore", el => el.textContent = d.sore + "/10");
  safe("popup-rest", el => el.textContent = d.rest + "d");
  safe("popup-ready", el => el.textContent = lastRecovery.score + "/100");
  safe("popup-reasons", el => el.innerHTML = d.reasons.map(r => `<li>${r}</li>`).join(""));
  safe("popup-sub", el => el.textContent = failed ? "HIGH CHANCE YOU FAIL - REST TODAY" : caution ? "RISKY - DROP 5-10 KG" : "SAFE TO ATTEMPT THIS LIFT");
  safe("popup-advice", el => el.textContent = advice);
  safe("popup-warning", el => el.style.display = failed ? "block" : "none");
  $("result-popup")?.classList.add("show");
}
function hidePopup() { $("result-popup")?.classList.remove("show"); }

// ---------- RESULT - 5 OUTPUTS ----------
function renderResult(data) {
  const prob01 = Number(data.fail_probability);
  if (!Number.isFinite(prob01)) throw new Error("API did not return fail_probability");
  const clamped = Math.max(0, Math.min(100, prob01 * 100));
  const failPct = clamped;
  const completePct = 100 - failPct;
  const failed = clamped >= 50;
  const caution = clamped >= 30 && clamped < 50;
  const riskLabel = failed ? "HIGH" : caution ? "MEDIUM" : "LOW";
  const target = Number(targetInput?.value) || 0;
  const prior = getNum("prior-success") ?? 0;
  const sleep = getNum("sleep-hours") ?? 7;
  const sore = getNum("soreness") ?? 5;
  const rest = getNum("rest-days") ?? 1;
  const energy = getNum("energy") ?? 7;

  let safeWeight = target;
  if (failed) safeWeight = Math.round(prior * 0.92);
  else if (caution) safeWeight = Math.round(target * 0.92);
  else safeWeight = target;
  if (safeWeight < 20) safeWeight = 20;

  const conf = data.confidence !== undefined ? Math.round(data.confidence * 100) : Math.round(65 + lastRecovery.score * 0.25);

  const reasons = [];
  if (sleep < 6) reasons.push(`Low sleep (${sleep} hrs) - reduces strength & focus`);
  if (sore >= 7) reasons.push(`High soreness (${sore}/10) - muscles not recovered`);
  if (rest < 1) reasons.push(`No rest day - body needs recovery`);
  if (energy < 5) reasons.push(`Low freshness (${energy}/10) - low energy today`);
  if (prior > 0 && target / prior > 1.10) reasons.push(`Big jump: ${((target/prior-1)*100).toFixed(0)}% above your PR (${prior}kg → ${target}kg)`);
  if (lastRecovery.score < 50) reasons.push(`Recovery score low: ${lastRecovery.score}/100`);
  if (reasons.length === 0) reasons.push(`All factors good: slept well, low soreness, fresh & small jump. Safe to attempt.`);

  lastPopupData = { completePct, safeWeight, conf, confEstimated: data.confidence === undefined, prior, target, sleep, sore, rest, reasons };

  animateGauge(clamped, failed);

  const title = failed ? "DON'T LIFT THIS" : caution ? "BE CAREFUL" : "GO FOR IT";
  const sub = failed ? "HIGH CHANCE YOU FAIL - REST TODAY" : caution ? "RISKY - DROP 5-10 KG" : "SAFE TO ATTEMPT THIS LIFT";
  const advice = failed
    ? `Recovery ${lastRecovery.score}/100 ${lastRecovery.verdict}. Try ${safeWeight}kg instead of ${target}kg. Drop weight or rest today. Don't force this PR.`
    : caution
    ? `Recovery ${lastRecovery.score}/100 ${lastRecovery.verdict}. Try ${safeWeight}kg instead, or rest one more day.`
    : `Recovery ${lastRecovery.score}/100 ${lastRecovery.verdict}. You are ready. Warm up well and go.`;

  safe("d-sleep", el => el.textContent = sleep + " hrs");
  safe("d-sore", el => el.textContent = sore + " / 10");
  safe("d-rest", el => el.textContent = rest + " day");
  safe("d-target", el => el.textContent = target + " kg");
  safe("d-pr", el => el.textContent = prior + " kg");
  safe("d-ready", el => { el.textContent = lastRecovery.score + "/100"; el.style.color = lastRecovery.score >= 75 ? "#b8ff00" : lastRecovery.score >= 50 ? "#eab308" : "#ff3b30"; });
  safe("out-complete", el => el.textContent = completePct.toFixed(0) + "%");
  safe("out-risk", el => { el.textContent = riskLabel; el.style.color = failed ? "#ff3b30" : caution ? "#eab308" : "#b8ff00"; });
  safe("out-safe", el => el.textContent = safeWeight + " kg");
  safe("out-conf", el => el.textContent = conf + "%" + (data.confidence === undefined ? " (estimated)" : ""));
  safe("lift-badge", el => { el.textContent = riskLabel + " RISK"; el.className = "lift-badge " + (failed ? "high" : caution ? "medium" : "low"); });
  safe("verdict-eyebrow", el => el.textContent = `RECOVERY ${lastRecovery.score}/100 · ${lastRecovery.verdict}`);
  safe("verdict-title", el => { el.textContent = title; el.className = `verdict-title ${failed ? "danger" : "safe"}`; });
  safe("verdict-sub", el => { el.textContent = sub; el.className = `verdict-sub ${failed ? "danger" : "safe"}`; });
  safe("advice-text", el => el.textContent = advice);
  safe("model-name", el => el.textContent = "");
  safe("model-threshold", el => el.textContent = "");
  safe("model-class", el => el.textContent = "");
  safe("risk-list", el => el.innerHTML = reasons.map(r => `<li>${r}</li>`).join(""));
  safe("recovery-warning", el => el.style.display = failed ? "block" : "none");

  setTimeout(() => showPopup(failed, clamped, advice), 450);
}

// ---------- PREDICT - WITH PLACEHOLDER / EMPTY CHECKS ----------
async function runPrediction() {
  const age = getNum("age");
  const bodyweight = getNum("bodyweight");
  const target = getNum("target-weight");
  const prior = getNum("prior-success");
  // Clear old red borders
  ["age","bodyweight","prior-success","target-weight"].forEach(clearMark);

  // 1. AGE - most important, check first
  if (age === null) { setStatus("⚠️ ENTER YOUR AGE", true); safe("verdict-title", el => el.textContent = "ENTER YOUR AGE"); safe("verdict-sub", el => el.textContent = "PLEASE TYPE YOUR AGE FIRST"); safe("verdict-eyebrow", el => el.textContent = "MISSING INFO"); markEmpty("age"); return; }
  if (age < 10 || age > 100) { setStatus("⚠️ AGE MUST BE 10-100", true); safe("verdict-title", el => el.textContent = "CHECK AGE"); safe("verdict-sub", el => el.textContent = "AGE MUST BE BETWEEN 10 AND 100"); markEmpty("age"); return; }
  // 2. BODYWEIGHT
  if (bodyweight === null) { setStatus("⚠️ ENTER YOUR BODYWEIGHT", true); safe("verdict-title", el => el.textContent = "ENTER BODYWEIGHT"); safe("verdict-sub", el => el.textContent = "PLEASE TYPE YOUR WEIGHT IN KG - e.g. 80"); markEmpty("bodyweight"); return; }
  if (bodyweight <= 0 || bodyweight > 300) { setStatus("⚠️ CHECK BODYWEIGHT", true); safe("verdict-title", el => el.textContent = "CHECK BODYWEIGHT"); safe("verdict-sub", el => el.textContent = "BODYWEIGHT MUST BE 20 - 300 KG"); markEmpty("bodyweight"); return; }
  // 3. TARGET
  if (target === null || target <= 0 || target > 1000) { setStatus("⚠️ ENTER TARGET WEIGHT", true); safe("verdict-title", el => el.textContent = "ENTER TARGET WEIGHT"); safe("verdict-sub", el => el.textContent = "HOW MUCH DO YOU WANT TO LIFT TODAY?"); markEmpty("target-weight"); return; }
  // 4. LAST BEST (PR)
  if (prior === null) { setStatus("⚠️ ENTER YOUR LAST BEST", true); safe("verdict-title", el => el.textContent = "ENTER LAST BEST"); safe("verdict-sub", el => el.textContent = "HEAVIEST YOU LIFTED BEFORE - e.g. 100"); markEmpty("prior-success"); return; }
  if (prior < 0 || prior > 1000) { setStatus("⚠️ CHECK LAST BEST", true); safe("verdict-title", el => el.textContent = "CHECK LAST BEST"); safe("verdict-sub", el => el.textContent = "LAST BEST MUST BE 0 - 1000 KG"); markEmpty("prior-success"); return; }

  updateRecovery();
  if (runButton) { runButton.disabled = true; runButton.innerHTML = "CHECKING... <span>◌</span>"; }
  setStatus("CHECKING YOUR LIFT...");
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`${API_BASE}/predict`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        Age: age, BodyweightKg: bodyweight,
        Sex: $("sex")?.value || "M",
        Event: "SBD",
        Equipment: $("equipment")?.value || "Raw",
        lift_type: liftMap[$("lift-type")?.value] || "Squat",
        attempt_number: Number($("attempt-number")?.value) || 1,
        target_weight_kg: target,
        prior_successful_weight_kg: prior,
        sleep_hours: getNum("sleep-hours") ?? 7,
        soreness: getNum("soreness") ?? 5,
        rest_days: getNum("rest-days") ?? 1,
        energy: getNum("energy") ?? 7
      })
    });
    clearTimeout(timeout);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || `API error ${response.status}`);
    renderResult(data);
    setStatus("● READY - RESULT RECEIVED");
  } catch (error) {
    setStatus("API OFFLINE / REQUEST FAILED", true);
    safe("verdict-eyebrow", el => el.textContent = "NO RESPONSE");
    safe("verdict-title", el => { el.textContent = "API ERROR"; el.className = "verdict-title danger"; });
    safe("verdict-sub", el => el.textContent = error.name === "AbortError" ? "REQUEST TIMED OUT - IS BACKEND RUNNING?" : error.message);
    safe("failure-prob", el => el.textContent = "—");
    safe("popup-title", el => { el.textContent = "API ERROR"; el.className = "popup-title"; });
    safe("popup-prob", el => el.textContent = "—");
    safe("popup-sub", el => el.textContent = "Backend not reachable. Start: python -m uvicorn main:app --reload");
    safe("popup-warning", el => el.style.display = "none");
    $("result-popup")?.classList.add("show");
  } finally {
    if (runButton) { runButton.disabled = false; runButton.innerHTML = "🚀 CHECK MY LIFT <span>→</span>"; }
  }
}

// ---------- OVERVIEW ----------
async function loadOverview() {
  try {
    const response = await fetch(`${API_BASE}/overview`);
    if (!response.ok) throw new Error("Overview unavailable");
    const data = await response.json();
    if (data.total_records !== undefined) safe("dataset-rows", el => el.textContent = Number(data.total_records).toLocaleString());
    safe("model-file-status", el => el.textContent = data.model_available ? "READY ✅" : "NOT READY");
    const acc = data.models?.logistic_regression?.accuracy || data.models?.decision_tree?.accuracy;
    if (acc !== undefined) safe("acc-main", el => el.textContent = acc + "%");
    setStatus("● READY");
  } catch {
    safe("model-file-status", el => el.textContent = "OFFLINE");
    setStatus("API OFFLINE · START BACKEND", true);
  }
}

// ---------- BIG CARD POPUP DATA ----------
const CARD_DATA = {
  heavy: {
    title: "HEAVY LIFT", tag: "MAX ATTEMPT · 90-100%", intro: "Heavy Lift means lifting 90-100% of your Personal Record. This is where strength is built - but also where most injuries happen. Only attempt it when your body is fully ready.",
    stats: [["90-100%", "INTENSITY"], ["1-3 REPS", "PER SET"], ["3-5 MIN", "REST BETWEEN SETS"]],
    cards: [
      {h: "✅ ADVANTAGES", list: ["Builds maximum strength fast", "Tests your real limit", "Boosts confidence & mental toughness", "Shows if your training is working"]},
      {h: "🍗 FOOD REQUIREMENTS", list: ["Protein: 1.6-2g per kg bodyweight", "Carbs 2-3 hrs before: rice, oats, banana", "Water: 3-4 litres per day", "After lift: chicken + rice / paneer + roti within 1 hr"]},
      {h: "🧘 BODY MAINTENANCE", list: ["Sleep 7-9 hrs night before", "Warm-up 10 mins + 2 light sets", "Foam roll legs & back after", "Rest 48 hrs before next heavy day"]},
      {h: "⚠️ WHEN TO SKIP?", list: ["Slept less than 5 hrs", "Soreness 8+/10", "Sharp joint pain", "Felt dizzy last session"], red: true},
      {h: "🎯 HOW TO TRY IT SAFELY", text: "Start with 60% x 5 reps → 75% x 3 reps → 90% x 1 rep → Then try your target. Always use spotter + safety bars. If bar speed slows a lot, stop - do not force 2nd rep.", full: true}
    ]
  },
  noexcuses: {
    title: "NO EXCUSES", tag: "DISCIPLINE · CONSISTENCY", intro: "No Excuses does NOT mean lift injured. It means show up even on low-motivation days. On bad days, do light training instead of skipping fully.",
    stats: [["5-6 DAYS", "TRAIN / WEEK"], ["30-60 MIN", "PER SESSION"], ["100%", "CONSISTENCY"]],
    cards: [
      {h: "✅ ADVANTAGES", list: ["Habit builds faster than motivation", "Small daily wins = big yearly progress", "Keeps metabolism & mood high", "You never lose momentum"]},
      {h: "🍗 FOOD REQUIREMENTS", list: ["Never train empty stomach", "Pre-workout: banana + coffee / oats", "Daily protein: dal, eggs, chicken, paneer", "Avoid junk - it kills recovery"]},
      {h: "🧘 BODY MAINTENANCE", list: ["Stretch 5 mins daily", "1 full rest day per week is mandatory", "Track sleep & soreness in this app", "Deload every 4th week - lift 50% lighter"]},
      {h: "⚠️ REAL NO-EXCUSES RULE", list: ["Tired? Do light 50% workout", "Sore? Do mobility + walk", "Injured? Rest + doctor, not gym", "Busy? Do 20 min home workout"], red: true},
      {h: "🎯 TODAY'S PLAN", text: "If you feel 7+/10 fresh - train heavy. If 4-6/10 - train light. If below 4/10 - walk + stretch only. That is still NO EXCUSES.", full: true}
    ]
  },
  prmode: {
    title: "PR MODE", tag: "PERSONAL RECORD", intro: "PR = Personal Record. Your heaviest successful lift ever. PR Mode is testing day - you try to beat your old best by 2.5kg - 5kg, not 20kg.",
    stats: [["+2.5 KG", "SAFE PR JUMP"], ["1 REP", "PR ATTEMPT"], ["110%", "MAX SAFE JUMP"]],
    cards: [
      {h: "✅ ADVANTAGES", list: ["Proves your training worked", "Sets new baseline for next cycle", "Huge confidence boost", "Helps coach plan next program"]},
      {h: "🍗 FOOD REQUIREMENTS", list: ["Night before: high carb dinner - rice / pasta", "Morning: oats + banana + eggs", "1 hr before: small carb snack", "Creatine 5g daily if you use it - helps PR"]},
      {h: "🧘 BODY MAINTENANCE", list: ["Taper: lift light 2 days before PR", "Sleep 8+ hrs for 2 nights before", "No new exercise on PR day", "Warm-up longer - 15 mins"]},
      {h: "⚠️ PR DAY MISTAKES", list: ["Jumping +15kg at once", "No spotter", "Trying PR after bad sleep", "Copying someone else's PR"], red: true},
      {h: "🎯 HOW OUR APP HELPS", text: "Enter your Last Best (old PR) + Target weight. Our model tells your fail %. Green = Go for PR. Yellow = Drop 5kg and try. Red = Rest, try PR tomorrow.", full: true}
    ]
  },
  beast: {
    title: "BEAST MODE", tag: "MINDSET + ENERGY", intro: "Beast Mode is not shouting. It is full focus + full recovery. Beast Mode ON = you are fresh, fed, slept well. Beast Mode OFF = you are tired, be smart and rest.",
    stats: [["8+ HRS", "SLEEP NEEDED"], ["8-10/10", "ENERGY SCORE"], ["<3/10", "SORENESS"]],
    cards: [
      {h: "✅ ADVANTAGES", list: ["Maximum focus = better form", "More power in every rep", "Less injury risk", "You enjoy training more"]},
      {h: "🍗 FOOD REQUIREMENTS", list: ["Protein every meal - 25-35g", "Carbs = fuel for beast mode", "Banana + peanut butter pre-workout", "Water + electrolytes during training"]},
      {h: "🧘 BODY MAINTENANCE", list: ["Sleep is #1 beast mode supplement", "Cold shower / walk for recovery", "Massage / foam roll weekly", "No alcohol 24 hrs before heavy day"]},
      {h: "⚠️ FAKE BEAST MODE", list: ["Energy drink + no sleep = injury", "Anger lifting = bad form", "Ignoring pain = hospital", "Ego lifting = failed lift"], red: true},
      {h: "🎯 CHECK YOUR BEAST MODE", text: "In our app, check Recovery Score. If Recovery = HIGH + Freshness 8+ = Beast Mode ON. If Recovery = LOW = Beast Mode OFF, do light day.", full: true}
    ]
  },
  deadlift: {
    title: "DEADLIFT", tag: "FULL BODY KING", intro: "Deadlift lifts the bar from floor to standing. It uses legs, back, grip, core - everything. It builds the most strength, but bad form = back injury. Technique first, weight second.",
    stats: [["FULL BODY", "MUSCLES USED"], ["1-5 REPS", "BEST RANGE"], ["2x / WEEK", "MAX FREQUENCY"]],
    cards: [
      {h: "✅ ADVANTAGES", list: ["Builds back, legs, grip together", "Best for overall strength", "Improves posture", "Burns most calories per lift"]},
      {h: "🍗 FOOD REQUIREMENTS", list: ["High protein: eggs, chicken, fish, dal", "Carbs before: rice + banana", "Iron: spinach, red meat for strength", "Water: 500ml during session"]},
      {h: "🧘 BODY MAINTENANCE", list: ["Never round your lower back", "Brace core - big breath before pull", "Flat shoes or barefoot", "Rest 72 hrs between heavy deadlifts"]},
      {h: "⚠️ STOP IMMEDIATELY IF", list: ["Sharp lower back pain", "Grip fails suddenly", "Dizziness / blackout feeling", "Knee / hip clicks with pain"], red: true},
      {h: "🎯 DEADLIFT FORM CHECK", text: "Feet under hips → Hips back → Chest up → Bar close to shins → Push floor away → Stand tall. If you cannot keep back flat, weight is too heavy - drop 10kg.", full: true}
    ]
  },
  squat: {
    title: "SQUAT", tag: "KING OF LIFTS", intro: "Squat is the king. You sit down with bar on back and stand up. It builds legs, glutes, core and mental toughness. Depth + knee control = safe squat.",
    stats: [["QUADS + GLUTES", "MAIN MUSCLES"], ["5x5", "BEST BEGINNER SET"], ["90°+", "DEPTH TARGET"]],
    cards: [
      {h: "✅ ADVANTAGES", list: ["Biggest leg & glute builder", "Improves balance & mobility", "Boosts testosterone & strength", "Helps all other lifts"]},
      {h: "🍗 FOOD REQUIREMENTS", list: ["Protein: 1.8g/kg for leg growth", "Carbs: oats, rice, sweet potato", "Calcium: milk, curd for bones", "Post-squat: protein shake + banana"]},
      {h: "🧘 BODY MAINTENANCE", list: ["Ankle mobility stretch daily", "Warm-up: bodyweight squats x 20", "Knees track over toes, not inward", "Rest 48 hrs between heavy squats"]},
      {h: "⚠️ STOP IMMEDIATELY IF", list: ["Knee pain inside joint", "Lower back rounds at bottom", "Heel lifts off floor", "You lean too far forward"], red: true},
      {h: "🎯 SQUAT FORM CHECK", text: "Feet shoulder width → Toes slightly out → Chest up → Sit back & down → Thighs parallel → Drive up through heels. Use safety bars always for heavy squat.", full: true}
    ]
  }
};

function openCardPopup(key, cardEl) {
  const d = CARD_DATA[key];
  const popup = $("card-popup");
  if (!d || !popup) return;
  const img = cardEl?.querySelector("img");
  safe("card-popup-img", el => { if (img) el.src = img.src; });
  safe("card-popup-tag", el => el.textContent = d.tag);
  safe("card-popup-title", el => el.innerHTML = d.title + ' <span>GUIDE</span>');
  safe("card-popup-intro", el => el.textContent = d.intro);
  safe("card-popup-stats", el => el.innerHTML = d.stats.map(s => `<div class="mini-stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join(""));
  safe("card-popup-grid", el => el.innerHTML = d.cards.map(c => {
    if (c.full) return `<div class="info-card full lime"><h4>${c.h}</h4><p>${c.text}</p></div>`;
    return `<div class="info-card ${c.red ? "red" : ""}"><h4>${c.h}</h4><ul>${c.list.map(li => `<li>${li}</li>`).join("")}</ul></div>`;
  }).join(""));
  popup.classList.add("show");
  const box = popup.querySelector(".big-popup-box");
  if (box) box.scrollTop = 0;
}
function closeCardPopup() { $("card-popup")?.classList.remove("show"); }

// ---------- INIT ----------
safe("dec-weight", el => el.addEventListener("click", () => updateWeight(Math.max(1, Number(targetInput?.value) - 2.5))));
safe("inc-weight", el => el.addEventListener("click", () => updateWeight(Math.min(1000, Number(targetInput?.value) + 2.5))));
safe("weight-slider", el => el.addEventListener("input", () => updateWeight(el.value)));
safe("target-weight", el => el.addEventListener("input", () => { clearMark("target-weight"); updateWeight(el.value); }));
safe("prior-success", el => el.addEventListener("input", () => { clearMark("prior-success"); updateWeight(targetInput?.value); }));
safe("age", el => el.addEventListener("input", () => clearMark("age")));
safe("bodyweight", el => el.addEventListener("input", () => clearMark("bodyweight")));
safe("run-prediction", el => el.addEventListener("click", runPrediction));
safe("popup-close", el => el.addEventListener("click", hidePopup));
safe("popup-ok", el => el.addEventListener("click", hidePopup));
safe("result-popup", el => el.addEventListener("click", (e) => { if (e.target.id === "result-popup") hidePopup(); }));
safe("card-popup-close", el => el.addEventListener("click", closeCardPopup));
safe("card-popup-ok", el => el.addEventListener("click", () => { closeCardPopup(); $("run-prediction")?.scrollIntoView({ behavior: "smooth", block: "center" }); }));
safe("card-popup", el => el.addEventListener("click", (e) => { if (e.target.id === "card-popup") closeCardPopup(); }));
document.querySelectorAll(".gym-card").forEach(card => {
  card.style.cursor = "pointer";
  card.addEventListener("click", () => openCardPopup(card.dataset.card, card));
});
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && !$("result-popup")?.classList.contains("show") && !$("card-popup")?.classList.contains("show")) runPrediction(); if (e.key === "Escape") { hidePopup(); closeCardPopup(); } });
["sleep-hours","soreness","rest-days","energy"].forEach(id => safe(id, el => el.addEventListener("input", updateRecovery)));
safe("session-date", el => el.textContent = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase());
// FIXED: Don't read empty targetInput -> would refill to 110. Start at 100, slider only.
updateWeight(100);
updateRecovery();
loadOverview();

// ---------- FLOATING PHOTOS ----------
(function initFloatingBg() {
  const layer = document.getElementById("float-layer");
  if (!layer) return;
  const objs = [...layer.querySelectorAll(".float-obj")];
  if (!objs.length) return;
  let raf = null, mx = 0, my = 0;
  document.addEventListener("mousemove", (e) => {
    mx = (e.clientX / window.innerWidth - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
    if (raf) return;
    raf = requestAnimationFrame(() => {
      objs.forEach(o => {
        const d = Number(o.dataset.depth || 30);
        o.style.translate = `${(-mx * d).toFixed(1)}px ${(-my * d).toFixed(1)}px`;
      });
      raf = null;
    });
  });
})();
console.log("PR-or-Hospital JS loaded ✅ - FINAL + Placeholder Fix + Big Popup + 5 Outputs");