// Banc de mesure R.7D, volet Safari. Programme jetable : ce n'est pas le jeu.
// Il mesure un petit modèle d'IA local (WebLLM / WebGPU) sur les cas T01–T04 et T24
// de la tranche verticale, et compare les résultats aux seuils fixés au palier 1.

const WEBLLM_URL = "./vendor/web-llm-0.2.86.js"; // @mlc-ai/web-llm 0.2.86, licence Apache 2.0
const STORE_KEY = "banc-resultats-v1";
const RUNNING_KEY = "banc-en-cours-v1";

// Candidats tenant a priori dans un iPhone à 6 Go (mémoire GPU estimée par WebLLM).
const MODELS = [
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 · 1B", mb: 879 },
  { id: "Qwen3.5-0.8B-q4f16_1-MLC", label: "Qwen 3.5 · 0,8B", mb: 1629 },
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 · 1,5B", mb: 1630 },
  { id: "Qwen3-1.7B-q4f16_1-MLC", label: "Qwen 3 · 1,7B", mb: 2037 },
  { id: "Qwen3.5-2B-q4f16_1-MLC", label: "Qwen 3.5 · 2B", mb: 2245 },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama 3.2 · 3B", mb: 2264 },
  { id: "Qwen2.5-3B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 · 3B", mb: 2505 },
];

// Seuils du palier 1 (conception/palier-1/TRANCHE_VERTICALE_ET_CRITERES.md). Jamais abaissés.
const SEUILS = {
  F4_ratio: 0.9, P1_p90: 3000, P1_max: 6000, P2_p90: 15000,
  P5_bytes: 6 * 1024 ** 3, P6_min: 60, P7_ratio: 0.8, P9_pct_h: 15,
};

// ---------- Cas de test ----------

const INTERP_SYSTEM = `Tu es l'interpréteur d'actions d'un jeu de simulation de vie dans l'univers de One Piece.
Tu ne racontes rien et tu n'inventes aucun fait. Tu traduis la phrase du joueur en intentions, à partir de l'état fourni.
Réponds uniquement avec un objet JSON de la forme :
{"intentions":[{"action":"...","cible":"...","condition":null}],"clarification":null}
- "intentions" : chaque action voulue, dans l'ordre.
- "condition" : texte de la condition si l'action n'a lieu que sous condition, sinon null.
- "clarification" : si la phrase est trop ambiguë pour être interprétée, une seule question courte au joueur, et "intentions" vide. Sinon null.`;

const STR_OR_NULL = { anyOf: [{ type: "string" }, { type: "null" }] };
const INTERP_SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    intentions: { type: "array", items: { type: "object",
      properties: { action: { type: "string" }, cible: { type: "string" }, condition: STR_OR_NULL },
      required: ["action", "cible", "condition"] } },
    clarification: STR_OR_NULL,
  },
  required: ["intentions", "clarification"],
});

const NARR_RULES = `Règles absolues : n'utilise que les faits fournis. N'invente aucun nom, objet, lieu, nombre ou événement. Si une information n'est pas fournie, le personnage ne la connaît pas. Écris en français, au présent, dans le ton de One Piece.`;

const REFUS = /(sais pas|sais rien|aucune idée|j'ignore|ignore|pas au courant|pas la moindre idée|rien vu|pas vu|n'en sais|me demande bien|aucune information)/i;

const CASES = [
  {
    id: "T01", kind: "interp",
    title: "Action libre à intentions multiples et condition",
    messages: [
      { role: "system", content: INTERP_SYSTEM },
      { role: "user", content: `État : le protagoniste est au bar Partys, à Fuchsia. Makino est derrière le comptoir. Lieux proches : port, place du village.
Phrase du joueur : « Je salue Makino, je lui demande s'il y a du travail au port et, si oui, j'y vais. »` },
    ],
    check(text) {
      const j = parseJson(text);
      if (!j || !Array.isArray(j.intentions)) return { v: "sur", note: "JSON invalide : rejeté par le moteur" };
      const n = j.intentions.length;
      const cond = j.intentions.some(i => i && typeof i.condition === "string" && i.condition.trim());
      if (n >= 3 && cond && !j.clarification) return { v: "correct", note: `${n} intentions, condition présente` };
      if (j.clarification && n === 0) return { v: "sur", note: "Demande de précision au lieu d'interpréter" };
      return { v: "verifier", note: `${n} intention(s), condition ${cond ? "présente" : "absente"}` };
    },
  },
  {
    id: "T02", kind: "interp",
    title: "Intention ambiguë : clarification ciblée",
    messages: [
      { role: "system", content: INTERP_SYSTEM },
      { role: "user", content: `État : le protagoniste est sur la place du village de Fuchsia. Personne ne lui a rien demandé. Aucune tâche en cours.
Phrase du joueur : « Je m'en occupe. »` },
    ],
    check(text) {
      const j = parseJson(text);
      if (!j) return { v: "sur", note: "JSON invalide : rejeté par le moteur" };
      const n = Array.isArray(j.intentions) ? j.intentions.length : 0;
      const q = typeof j.clarification === "string" && j.clarification.trim();
      if (q && n === 0) return { v: "correct", note: "Question de clarification" };
      if (!q && n > 0) return { v: "faux", note: "Action inventée sans référent" };
      return { v: "verifier", note: "Clarification et intentions mêlées" };
    },
  },
  {
    id: "T03", kind: "narr",
    title: "PNJ non omniscient",
    messages: [
      { role: "system", content: `Tu fais parler un personnage non joueur. ${NARR_RULES}` },
      { role: "user", content: `Personnage : le charpentier du village de Fuchsia.
Ce qu'il sait : le toit de la remise du maire est abîmé ; une planche coûte 20 Berrys ; il a passé la soirée d'hier chez lui.
Le protagoniste lui demande : « Sais-tu qui a volé la caisse du marchand hier soir ? »
Écris uniquement la réplique du charpentier (2 à 3 phrases).` },
    ],
    check(text) {
      return REFUS.test(text)
        ? { v: "correct", note: "Le PNJ dit ne pas savoir" }
        : { v: "verifier", note: "Pas de refus détecté : vérifier qu'aucun coupable n'est inventé" };
    },
  },
  {
    id: "T04", kind: "narr",
    title: "Mémoire subjective d'un PNJ",
    messages: [
      { role: "system", content: `Tu fais parler un personnage non joueur. ${NARR_RULES}` },
      { role: "user", content: `Personnage : Makino, qui tient le bar Partys à Fuchsia.
Son souvenir : il y a deux jours, le protagoniste lui a confié qu'il voulait devenir charpentier.
Le protagoniste lui demande : « Tu te souviens de ce que je t'ai dit l'autre jour ? »
Écris uniquement la réplique de Makino (2 à 3 phrases).` },
    ],
    check(text) {
      return /charpent/i.test(text)
        ? { v: "correct", note: "Le souvenir est restitué" }
        : { v: "verifier", note: "Souvenir non restitué ?" };
    },
  },
  {
    id: "T24", kind: "narr", long: true,
    title: "Narration fidèle aux seuls faits établis",
    messages: [
      { role: "system", content: `Tu es le narrateur. ${NARR_RULES}` },
      { role: "user", content: `Faits établis :
- Lieu : Fuchsia, devant la remise du maire Woop Slap. C'est la fin d'après-midi.
- Le protagoniste vient de terminer la réparation du toit de la remise.
- Le maire Woop Slap lui remet les 500 Berrys promis.
- Le protagoniste est fatigué et a une petite écharde à la main.
Raconte cette scène en environ 120 mots.` },
    ],
    allowedNumbers: ["500", "120"],
    allowedNames: ["Fuchsia", "Woop", "Slap", "Berrys", "Berry", "One", "Piece"],
    check(text) {
      const flags = [];
      for (const n of text.match(/\d+/g) || []) if (!this.allowedNumbers.includes(n)) flags.push(`nombre ${n}`);
      for (const w of properNouns(text)) if (!this.allowedNames.some(a => w.startsWith(a))) flags.push(w);
      return flags.length
        ? { v: "verifier", note: `Éléments à contrôler : ${[...new Set(flags)].slice(0, 6).join(", ")}` }
        : { v: "correct", note: "Aucun élément hors faits détecté" };
    },
  },
];

const ENDURANCE_SCENES = [
  "Le protagoniste aide le pêcheur à remonter ses filets au port de Fuchsia, au lever du jour. La pêche est maigre.",
  "Le protagoniste boit un verre de lait au bar Partys. Makino essuie des verres. Il pleut dehors.",
  "Le protagoniste porte trois planches du charpentier jusqu'à la remise du maire. Le chemin monte.",
  "Le protagoniste se repose sur la colline au-dessus du village et regarde la mer. Un navire marchand passe au loin.",
];

// ---------- Utilitaires ----------

const $ = id => document.getElementById(id);
const logEl = $("log");
function log(msg) {
  const t = new Date().toLocaleTimeString("fr-FR");
  logEl.textContent = `[${t}] ${msg}\n` + logEl.textContent;
}
function parseJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}
// Mots à majuscule hors liste autorisée : signalés pour vérification (sur-signaler est sans danger).
const MOTS_COURANTS = new Set(("le la les l un une des du de d au aux il elle ils elles on je tu nous vous " +
  "ce cette ces cet c ça sa son ses leur leurs mon ma mes ton ta tes et mais puis alors enfin quand lorsque " +
  "dans sur sous devant derrière après avant pendant tandis comme avec sans pour par en à y qui que quoi où " +
  "voici voilà oui non merci bien ah oh eh hein tiens allez bon là déjà encore pourtant soudain lentement " +
  "fatigué fatiguée heureux content sourire souriant épuisé ici rien tout tous toute chaque même aujourd hier").split(" "));
function properNouns(text) {
  return (text.match(/[A-ZÀ-Ý][A-Za-zÀ-ÿ'’-]*/g) || [])
    .map(w => w.split(/['’]/).pop())
    .filter(w => w && /^[A-ZÀ-Ý]/.test(w) && !MOTS_COURANTS.has(w.toLowerCase()));
}
function pct(arr, p) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)];
}
function median(arr) { return pct(arr, 0.5); }
const fmtMs = ms => ms == null ? "—" : `${(ms / 1000).toFixed(1)} s`;
const fmtGo = b => b == null ? "—" : `${(b / 1024 ** 3).toFixed(2)} Go`;
const words = t => (t.trim().match(/\S+/g) || []).length;

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || fresh(); } catch { return fresh(); }
}
function fresh() { return { version: 1, device: null, runs: [], endurance: [], crashes: [], storage: {} }; }
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { log(`Sauvegarde locale impossible : ${e.message}`); }
}
function markRunning(phase) {
  try { localStorage.setItem(RUNNING_KEY, JSON.stringify({ model: currentModel, phase, t: Date.now() })); } catch {}
}
function clearRunning() { try { localStorage.removeItem(RUNNING_KEY); } catch {} }

// ---------- État ----------

let db = load();
let webllm = null;
let engine = null;
let currentModel = null;
let busy = false;
let stopEndurance = false;

// Fermeture forcée détectée : la page a été rechargée pendant un calcul.
(function detectCrash() {
  let r = null;
  try { r = JSON.parse(localStorage.getItem(RUNNING_KEY)); } catch {}
  if (r) {
    db.crashes.push({ ...r, detectedAt: Date.now() });
    save(); clearRunning();
    $("crash").innerHTML = `<p class="ko">Fermeture forcée probable pendant « ${r.phase} » avec ${r.model} (${new Date(r.t).toLocaleString("fr-FR")}). Elle est comptée comme échec P4.</p>`;
  }
})();

// ---------- Appareil ----------

async function describeDevice() {
  const d = { ua: navigator.userAgent, webgpu: !!navigator.gpu, at: new Date().toISOString() };
  let html = "";
  if (d.webgpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        d.maxBufferMB = Math.round(adapter.limits.maxBufferSize / 1024 ** 2);
        d.maxStorageBufferMB = Math.round(adapter.limits.maxStorageBufferBindingSize / 1024 ** 2);
        d.shaderF16 = adapter.features.has("shader-f16");
      } else d.webgpu = false;
    } catch (e) { d.webgpu = false; d.gpuError = e.message; }
  }
  try {
    d.persisted = await navigator.storage?.persist?.();
    const est = await navigator.storage?.estimate?.();
    if (est) { d.quota = est.quota; d.usage = est.usage; }
  } catch {}
  db.device = d; save();
  html += d.webgpu
    ? `<p class="ok">WebGPU disponible</p><p class="muted">Tampon max : ${d.maxBufferMB} Mo · f16 : ${d.shaderF16 ? "oui" : "non"} · stockage persistant : ${d.persisted ? "oui" : "non"} · espace autorisé : ${fmtGo(d.quota)} · utilisé : ${fmtGo(d.usage)}</p>`
    : `<p class="ko">WebGPU indisponible : l'IA locale ne peut pas tourner dans ce navigateur.</p><p class="muted">Vérifie que tu ouvres la page dans Safari à jour (iOS 26). ${d.gpuError || ""}</p>`;
  $("device").innerHTML = html;
  return d.webgpu;
}

// ---------- Modèle ----------

function fillModels() {
  $("model").innerHTML = MODELS.map(m => `<option value="${m.id}">${m.label} — environ ${(m.mb / 1024).toFixed(1)} Go</option>`).join("");
}

async function ensureLib() {
  if (!webllm) { log("Chargement de la bibliothèque WebLLM…"); webllm = await import(WEBLLM_URL); }
  return webllm;
}

async function loadModel() {
  if (busy) return;
  busy = true; setButtons();
  const id = $("model").value;
  const bar = $("loadbar"); bar.hidden = false; bar.value = 0;
  try {
    const lib = await ensureLib();
    if (engine) { await engine.unload(); engine = null; currentModel = null; }
    currentModel = id;
    markRunning("chargement");
    const t0 = performance.now();
    engine = await lib.CreateMLCEngine(id, {
      initProgressCallback: p => { bar.value = p.progress || 0; $("loadtxt").textContent = p.text; },
    });
    const loadMs = performance.now() - t0;
    clearRunning();
    const est = await navigator.storage?.estimate?.();
    db.storage[id] = { usage: est?.usage ?? null, loadMs, at: Date.now() };
    save();
    $("loadtxt").textContent = `${id} prêt en ${fmtMs(loadMs)}. Stockage utilisé par la page : ${fmtGo(est?.usage)}.`;
    log(`Modèle chargé : ${id}`);
  } catch (e) {
    clearRunning();
    engine = null; currentModel = null;
    $("loadtxt").innerHTML = `<span class="ko">Échec du chargement : ${e.message}</span>`;
    log(`Échec du chargement : ${e.message}`);
  } finally { busy = false; bar.hidden = true; setButtons(); }
}

async function forgetModel() {
  if (busy) return;
  const id = $("model").value;
  if (!confirm(`Supprimer ${id} du téléphone ?`)) return;
  try {
    const lib = await ensureLib();
    if (engine && currentModel === id) { await engine.unload(); engine = null; currentModel = null; }
    await lib.deleteModelAllInfoInCache(id);
    const est = await navigator.storage?.estimate?.();
    $("loadtxt").textContent = `${id} supprimé. Stockage utilisé : ${fmtGo(est?.usage)}.`;
    log(`Modèle supprimé : ${id}`);
  } catch (e) { log(`Suppression impossible : ${e.message}`); }
  setButtons();
}

// ---------- Génération mesurée ----------

async function generate(messages, { json = false, maxTokens = 220 } = {}) {
  const req = {
    messages, stream: true, stream_options: { include_usage: true },
    temperature: 0.7, top_p: 0.9, max_tokens: maxTokens,
  };
  // WebLLM 0.2.86 exige un schéma explicite avec json_object (sinon erreur du grammar matcher).
  if (json) req.response_format = { type: "json_object", schema: INTERP_SCHEMA };
  if (/^Qwen3/.test(currentModel)) req.extra_body = { enable_thinking: false };
  const t0 = performance.now();
  let ttft = null, text = "", usage = null;
  const stream = await engine.chat.completions.create(req);
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content || "";
    if (delta && ttft == null && delta.trim()) ttft = performance.now() - t0;
    text += delta;
    if (chunk.usage) usage = chunk.usage;
  }
  const total = performance.now() - t0;
  const outTok = usage?.completion_tokens ?? null;
  const decodeS = ttft != null ? (total - ttft) / 1000 : null;
  return {
    text, ttft, total, outTok, words: words(text),
    tokPerS: outTok && decodeS > 0 ? outTok / decodeS : null,
  };
}

async function runQuality() {
  if (busy || !engine) return;
  busy = true; setButtons();
  const reps = Math.max(1, Math.min(20, parseInt($("reps").value, 10) || 10));
  const total = reps * CASES.length;
  const bar = $("qbar"); bar.hidden = false; bar.max = total; bar.value = 0;
  let done = 0, empties = 0;
  try {
    for (const c of CASES) {
      for (let r = 1; r <= reps; r++) {
        $("qtxt").textContent = `${c.id} · essai ${r}/${reps}`;
        markRunning(`série ${c.id}`);
        const g = await generate(c.messages, { json: c.kind === "interp", maxTokens: c.long ? 260 : 180 });
        clearRunning();
        // Réponse vide : le moteur IA ne répond plus (souvent perte du GPU sous pression mémoire).
        const auto = g.text.trim() ? c.check(g.text) : { v: "sur", note: "Réponse vide : moteur IA défaillant" };
        empties = g.text.trim() ? 0 : empties + 1;
        db.runs.push({ model: currentModel, case: c.id, kind: c.kind, long: !!c.long, rep: r, at: Date.now(),
          ...g, auto: auto.v, note: auto.note, verdict: auto.v === "verifier" ? null : auto.v });
        save();
        bar.value = ++done;
        if (empties >= 3) throw new Error("trois réponses vides de suite : le moteur IA ne répond plus. Recharge la page puis le modèle.");
      }
    }
    $("qtxt").textContent = `Série terminée : ${done} réponses. Vérifie-les plus bas.`;
    log(`Série terminée pour ${currentModel}`);
  } catch (e) {
    clearRunning();
    $("qtxt").innerHTML = `<span class="ko">Interruption : ${e.message}</span>`;
    log(`Série interrompue : ${e.message}`);
  } finally { busy = false; bar.hidden = true; setButtons(); renderReview(); renderSummary(); }
}

async function runEndurance() {
  if (busy || !engine) return;
  const mins = Math.max(1, Math.min(120, parseInt($("mins").value, 10) || 60));
  const bat0 = parseInt($("bat0").value, 10);
  busy = true; stopEndurance = false; setButtons();
  let lock = null;
  try { lock = await navigator.wakeLock?.request("screen"); } catch {}
  const session = { model: currentModel, start: Date.now(), plannedMin: mins, bat0: Number.isFinite(bat0) ? bat0 : null,
    bat1: null, samples: [], error: null, end: null };
  db.endurance.push(session); save();
  const deadline = Date.now() + mins * 60000;
  let i = 0;
  try {
    while (Date.now() < deadline && !stopEndurance) {
      const scene = ENDURANCE_SCENES[i++ % ENDURANCE_SCENES.length];
      markRunning("endurance");
      const g = await generate([
        { role: "system", content: `Tu es le narrateur. ${NARR_RULES}` },
        { role: "user", content: `Faits établis : ${scene}\nRaconte cette scène en environ 120 mots.` },
      ], { maxTokens: 260 });
      clearRunning();
      session.samples.push({ t: Date.now(), ttft: g.ttft, total: g.total, tokPerS: g.tokPerS, words: g.words });
      session.end = Date.now(); save();
      const left = Math.max(0, Math.round((deadline - Date.now()) / 60000));
      $("etxt").textContent = `${session.samples.length} scènes · ${g.tokPerS ? g.tokPerS.toFixed(1) : "—"} jetons/s · reste ${left} min`;
    }
  } catch (e) {
    clearRunning();
    session.error = e.message;
    log(`Endurance interrompue : ${e.message}`);
  } finally {
    session.end = Date.now(); save();
    try { await lock?.release(); } catch {}
    busy = false; setButtons(); renderSummary();
    $("etxt").textContent += " · terminé. Renseigne la batterie à la fin.";
  }
}

// ---------- Vérification et bilan ----------

const VERDICTS = [["correct", "Correct"], ["sur", "Sûr"], ["faux", "Faux"]];

function renderReview() {
  const runs = db.runs.filter(r => r.model === currentModel || !currentModel);
  if (!runs.length) { $("review").innerHTML = `<p class="muted">Aucune réponse pour l'instant.</p>`; return; }
  const pending = runs.filter(r => !r.verdict);
  const list = (pending.length ? pending : runs.slice(-15)).slice(0, 40);
  $("review").innerHTML = `<p class="muted">${pending.length} réponse(s) à vérifier${pending.length ? "" : " · affichage des 15 dernières"}.</p>` +
    list.map(r => {
      const idx = db.runs.indexOf(r);
      const c = CASES.find(x => x.id === r.case);
      return `<div class="card"><strong>${r.case}</strong> · essai ${r.rep} · <span class="muted">${c?.title || ""}</span>
        <p class="muted">${r.note} · ${fmtMs(r.ttft)} → ${fmtMs(r.total)}</p>
        <pre>${escapeHtml(r.text)}</pre>
        <div class="verdicts">${VERDICTS.map(([v, l]) =>
          `<button class="secondary ${r.verdict === v ? "on" : ""}" data-i="${idx}" data-v="${v}">${l}</button>`).join("")}</div></div>`;
    }).join("");
}
function escapeHtml(s) { return s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

function evaluate(model) {
  const runs = db.runs.filter(r => r.model === model);
  const res = { model, cases: {}, criteria: [] };
  let anyFaux = 0, allCasesOk = runs.length > 0, pendingAll = 0;
  for (const c of CASES) {
    const rs = runs.filter(r => r.case === c.id);
    const k = { n: rs.length, correct: 0, sur: 0, faux: 0, pending: 0 };
    rs.forEach(r => { if (!r.verdict) k.pending++; else k[r.verdict]++; });
    k.ok = k.n > 0 && k.pending === 0 && k.faux === 0 && k.correct / k.n >= SEUILS.F4_ratio;
    res.cases[c.id] = k;
    anyFaux += k.faux; pendingAll += k.pending;
    if (!k.ok) allCasesOk = false;
  }
  // Seules les réponses réellement produites comptent pour les délais.
  const narr = runs.filter(r => r.kind === "narr" && r.ttft != null && r.text.trim()).map(r => r.ttft);
  const end = db.endurance.filter(e => e.model === model);
  end.forEach(e => e.samples.forEach(s => s.ttft != null && narr.push(s.ttft)));
  const longT = runs.filter(r => r.long && r.words >= 50).map(r => r.total);
  end.forEach(e => e.samples.forEach(s => s.words >= 50 && longT.push(s.total)));
  const crashes = db.crashes.filter(c => c.model === model).length;
  const usage = db.storage[model]?.usage ?? null;

  const status = (ok, tested = true) => !tested ? "non testé" : ok ? "réussi" : "échoué";
  const add = (code, label, value, ok, tested = true) => res.criteria.push({ code, label, value, status: status(ok, tested) });

  add("F4", "Cas IA ≥ 9/10 corrects, échecs sûrs", pendingAll ? `${pendingAll} à vérifier` : "voir détail", allCasesOk, runs.length > 0 && pendingAll === 0);
  add("F5", "Aucun fait faux affiché", `${anyFaux} faux`, anyFaux === 0, runs.length > 0 && pendingAll === 0);
  const p90 = pct(narr, 0.9), mx = narr.length ? Math.max(...narr) : null;
  add("P1", "Premier mot ≤ 3 s (90 %), ≤ 6 s (tous)", `${fmtMs(p90)} / max ${fmtMs(mx)}`, p90 <= SEUILS.P1_p90 && mx <= SEUILS.P1_max, narr.length > 0);
  const p2 = pct(longT, 0.9);
  add("P2", "Narration ~120 mots ≤ 15 s (90 %)", fmtMs(p2), p2 <= SEUILS.P2_p90, longT.length > 0);
  add("P4", "Aucune fermeture forcée par iOS", `${crashes} fermeture(s)`, crashes === 0, runs.length > 0 || end.length > 0);
  add("P5", "Stockage ≤ 6 Go", fmtGo(usage), usage != null && usage <= SEUILS.P5_bytes, usage != null);

  const best = end.slice().sort((a, b) => (b.end - b.start) - (a.end - a.start))[0];
  if (best && best.samples.length >= 4) {
    const durMin = (best.end - best.start) / 60000;
    // Arrêt volontaire avant 60 min sans erreur : non testé, pas échoué.
    add("P6", "60 min continues sans plantage", `${durMin.toFixed(0)} min${best.error ? " · erreur" : ""}`, durMin >= SEUILS.P6_min && !best.error, durMin >= SEUILS.P6_min || !!best.error);
    const win = 5 * 60000;
    const first = best.samples.filter(s => s.t - best.start <= win).map(s => s.tokPerS).filter(Boolean);
    const last = best.samples.filter(s => best.end - s.t <= win).map(s => s.tokPerS).filter(Boolean);
    const ratio = median(first) ? median(last) / median(first) : null;
    add("P7", "Vitesse en fin ≥ 80 % du début (chauffe)", ratio == null ? "—" : `${Math.round(ratio * 100)} %`, ratio >= SEUILS.P7_ratio, ratio != null && durMin >= 20);
    const tested = best.bat0 != null && best.bat1 != null && durMin >= 20;
    const rate = tested ? (best.bat0 - best.bat1) / (durMin / 60) : null;
    add("P9", "Batterie ≤ 15 %/h", rate == null ? "—" : `${rate.toFixed(1)} %/h`, rate <= SEUILS.P9_pct_h, tested);
  } else {
    ["P6", "P7", "P9"].forEach(c => add(c, { P6: "60 min continues sans plantage", P7: "Chauffe", P9: "Batterie ≤ 15 %/h" }[c], "—", false, false));
  }
  const speeds = runs.map(r => r.tokPerS).filter(Boolean);
  res.tokPerS = median(speeds);
  res.loadMs = db.storage[model]?.loadMs ?? null;
  return res;
}

function renderSummary() {
  const models = [...new Set([...db.runs.map(r => r.model), ...db.endurance.map(e => e.model), ...db.crashes.map(c => c.model)])];
  if (!models.length) { $("summary").innerHTML = `<p class="muted">Lance une série pour voir le bilan.</p>`; return; }
  const cls = s => s === "réussi" ? "ok" : s === "échoué" ? "ko" : "warn";
  $("summary").innerHTML = models.map(m => {
    const e = evaluate(m);
    const mandatoryOk = e.criteria.every(c => c.status === "réussi");
    return `<h2>${MODELS.find(x => x.id === m)?.label || m}</h2>
      <p class="${mandatoryOk ? "ok" : "warn"}">${mandatoryOk ? "Tous les critères mesurés ici sont réussis" : "Au moins un critère n'est pas réussi : volet natif à mesurer ou modèle à écarter"}</p>
      <p class="muted">Vitesse médiane : ${e.tokPerS ? e.tokPerS.toFixed(1) : "—"} jetons/s · premier chargement mesuré : ${fmtMs(e.loadMs)}</p>
      <table><tr><th>Critère</th><th>Mesure</th><th>Statut</th></tr>
      ${e.criteria.map(c => `<tr><td><strong>${c.code}</strong> ${c.label}</td><td>${c.value}</td><td class="${cls(c.status)}">${c.status}</td></tr>`).join("")}
      </table>
      <table><tr><th>Cas</th><th>Correct</th><th>Sûr</th><th>Faux</th><th>À vérifier</th></tr>
      ${Object.entries(e.cases).map(([id, k]) => `<tr><td>${id}</td><td>${k.correct}/${k.n}</td><td>${k.sur}</td><td>${k.faux}</td><td>${k.pending}</td></tr>`).join("")}
      </table>`;
  }).join("") + `<p class="muted">P3 et P8 (ellipse, sauvegarde) concernent le moteur, pas l'IA : non mesurés ici.</p>`;
}

function exportData() {
  const models = [...new Set([...db.runs, ...db.endurance, ...db.crashes].map(x => x.model))];
  return JSON.stringify({ banc: "R.7D-safari", seuils: SEUILS, exportedAt: new Date().toISOString(),
    bilan: models.map(evaluate), ...db }, null, 2);
}

// ---------- Interface ----------

function setButtons() {
  $("load").disabled = busy;
  $("forget").disabled = busy;
  $("runq").disabled = busy || !engine;
  $("rune").disabled = busy || !engine;
  $("stope").disabled = !busy;
}

$("load").onclick = loadModel;
$("forget").onclick = forgetModel;
$("runq").onclick = runQuality;
$("rune").onclick = runEndurance;
$("stope").onclick = () => { stopEndurance = true; $("etxt").textContent += " · arrêt demandé…"; };
$("bat1").onchange = () => {
  const last = db.endurance[db.endurance.length - 1];
  const v = parseInt($("bat1").value, 10);
  if (last && Number.isFinite(v)) { last.bat1 = v; save(); renderSummary(); }
};
$("review").onclick = e => {
  const b = e.target.closest("button[data-i]");
  if (!b) return;
  db.runs[+b.dataset.i].verdict = b.dataset.v; save();
  renderReview(); renderSummary();
};
$("download").onclick = () => {
  const blob = new Blob([exportData()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `banc-ia-iphone-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};
$("share").onclick = async () => {
  const data = exportData();
  const file = new File([data], "banc-ia-iphone.json", { type: "application/json" });
  try {
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "Banc de mesure IA" });
    else { await navigator.clipboard.writeText(data); alert("Résultats copiés dans le presse-papiers."); }
  } catch (e) { if (e.name !== "AbortError") log(`Partage impossible : ${e.message}`); }
};
$("reset").onclick = () => {
  if (!confirm("Effacer tous les résultats enregistrés ?")) return;
  db = fresh(); save(); renderReview(); renderSummary(); log("Résultats effacés.");
};

fillModels();
setButtons();
renderReview();
renderSummary();
describeDevice();
