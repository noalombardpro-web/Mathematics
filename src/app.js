const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const typeset = el => { if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise(el ? [el] : undefined).catch(() => {}); };
const CH = [
  { id: "ch1", n: 1, cc: "var(--c1)" },
  { id: "ch2", n: 2, cc: "var(--c2)" }
];
let done = store.get("mt-done", {});

/* ---------- données des chapitres ---------- */
CH.forEach(c => {
  const el = document.getElementById(c.id);
  c.title = el.dataset.title;
  c.secs = $$(".sec", el).map(s => ({ id: s.id, t: s.dataset.t }));
  c.el = el;
});

/* ---------- navigation ---------- */
function renderNav(cur) {
  let h = `<small>Menu</small><a href="#accueil" ${cur === "accueil" ? 'aria-current="page"' : ""}>Accueil</a><small style="margin-top:12px">Chapitres</small>`;
  CH.forEach(c => {
    const active = cur === c.id;
    h += `<a class="ch" href="#${c.id}" style="--cc:${c.cc}" ${active ? 'aria-current="page"' : ""}><i>${c.n}</i>${c.title}<span class="pc">${pct(c)} %</span></a>`;
    if (active) h += `<div class="subnav">` + c.secs.map((s, i) =>
      `<a href="#${s.id}" class="${done[s.id] ? "done" : ""}">${i + 1}. ${s.t}<span class="d"></span></a>`).join("") + `</div>`;
  });
  $("#nav").innerHTML = h;
}
const nDone = c => c.secs.filter(s => done[s.id]).length;
const pct = c => Math.round(100 * nDone(c) / c.secs.length);
const TOTAL = CH.reduce((t, c) => t + c.secs.length, 0);
function renderCards() {
  $("#cards").innerHTML = CH.map(c => `<a class="card" href="#${c.id}" style="--cc:${c.cc}"><span class="k">Chapitre ${c.n}</span><h2>${c.title}</h2>
      <ol>${c.secs.map(s => `<li class="${done[s.id] ? "done" : ""}">${s.t}</li>`).join("")}</ol>
      <div class="pt"><span>${nDone(c)} / ${c.secs.length} sections revues</span><span>${pct(c)} %</span></div><div class="bar"><i style="width:${pct(c)}%"></i></div></a>`).join("");
  const g = CH.reduce((t, c) => t + nDone(c), 0), gp = Math.round(100 * g / TOTAL);
  $("#gp-t").textContent = `${g} / ${TOTAL} sections`; $("#gp-p").textContent = gp + " %";
  $("#gp-bar").innerHTML = CH.map((c, i) => `<i class="b${i + 1}" style="width:${100 * nDone(c) / TOTAL}%"></i>`).join("");
  $("#ring").style.strokeDashoffset = 326.7 * (1 - g / TOTAL); $("#ring-p").textContent = gp + " %";
  CH.forEach(c => { const b = $(".cprog", c.el); if (b) { $(".bar i", b).style.width = pct(c) + "%"; $("span", b).textContent = `${nDone(c)} / ${c.secs.length} sections revues`; } });
}
function show(token) {
  token = token || "accueil";
  let chap = CH.find(c => token === c.id || token.startsWith(c.id + "-"));
  const view = chap ? chap.id : "accueil";
  $("#accueil").hidden = view !== "accueil";
  CH.forEach(c => { c.el.hidden = c.id !== view; });
  document.documentElement.dataset.ch = view;
  document.title = (chap ? chap.title : "Accueil") + " · Maths Terminale";
  renderNav(view); renderCards();
  $("#side").classList.remove("open"); $("#menu-btn").setAttribute("aria-expanded", "false");
  const target = chap && token !== chap.id ? document.getElementById(token) : null;
  if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
  if (view === "ch1") drawGeo();
  onScroll();
}

/* ---------- barre de lecture et section courante ---------- */
function onScroll() {
  const h = document.documentElement, max = h.scrollHeight - h.clientHeight;
  $("#readbar").style.width = (max > 0 ? 100 * h.scrollY / max : 0) + "%";
  let cur = null;
  $$(".chapter:not([hidden]) .sec").forEach(s => { if (s.getBoundingClientRect().top < 140) cur = s.id; });
  $$(".subnav a").forEach(a => a.classList.toggle("here", a.getAttribute("href") === "#" + cur));
}
window.addEventListener("scroll", onScroll, { passive: true });

/* ---------- thème ---------- */
function setTheme(t, save) {
  const r = document.documentElement;
  if (t === "auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", t);
  $$("#theme button").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === t));
  if (save) store.set("mt-theme", t);
  drawGeo();
}
$("#theme").addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (b) setTheme(b.dataset.t, true); });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => drawGeo());
window.addEventListener("hashchange", () => show(location.hash.slice(1)));
$("#menu-btn").onclick = () => {
  const o = $("#side").classList.toggle("open"); $("#menu-btn").setAttribute("aria-expanded", o);
};

/* ---------- bouton « revu » et dépliage des preuves ---------- */
CH.forEach(c => {
  $$(".sec", c.el).forEach(s => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "done-btn"; b.setAttribute("aria-pressed", !!done[s.id]);
    b.textContent = done[s.id] ? "Revue" : "Marquer comme revue";
    b.onclick = () => {
      done[s.id] = !done[s.id]; if (!done[s.id]) delete done[s.id];
      store.set("mt-done", done);
      b.setAttribute("aria-pressed", !!done[s.id]); b.textContent = done[s.id] ? "Revue" : "Marquer comme revue";
      renderNav(c.id); renderCards();
    };
    $("h2", s).appendChild(b);
  });
  const t = document.createElement("div"); t.className = "tools";
  t.innerHTML = `<button class="btn" type="button" data-a="open">Déplier les démonstrations</button><button class="btn" type="button" data-a="close">Replier</button>`;
  t.onclick = e => { const a = e.target.dataset.a; if (a) $$("details.proof", c.el).forEach(d => d.open = a === "open"); };
  const pr = document.createElement("div"); pr.className = "cprog";
  pr.innerHTML = `<span></span><div class="bar"><i></i></div>`;
  $(".chead", c.el).append(pr, t);
  const LAB = { def: "Définition", thm: "Théorème", ex: "Exemple", warn: "Attention", tip: "Méthode", note: "Remarque" };
  $$(".sec", c.el).forEach((s, si) => {
    const cnt = {};
    $$(".box", s).forEach(b => {
      const k = Object.keys(LAB).find(k => b.classList.contains(k)); const t2 = b.firstElementChild;
      if (!k || !t2 || t2.tagName !== "B" || b.classList.contains("proof")) return;
      cnt[k] = (cnt[k] || 0) + 1;
      const lab = document.createElement("span"); lab.className = "lab";
      lab.textContent = ["def", "thm", "ex"].includes(k) ? `${LAB[k]} ${c.n}.${si + 1}.${cnt[k]}` : LAB[k];
      t2.prepend(lab);
    });
  });
});

/* ---------- explorateur de suite géométrique ---------- */
function drawGeo() {
  const cv = $("#g-cv"); if (!cv) return;
  const u0 = +$("#g-u0").value, q = +$("#g-q").value;
  $("#g-u0o").textContent = u0; $("#g-qo").textContent = q.toFixed(2);
  const ctx = cv.getContext("2d"), W = cv.width, H = cv.height;
  const css = getComputedStyle(document.documentElement);
  const col = n => css.getPropertyValue(n).trim();
  ctx.clearRect(0, 0, W, H);
  const N = 20, terms = [];
  for (let n = 0; n <= N; n++) terms.push(u0 * Math.pow(q, n));
  const m = Math.max(1, Math.min(12, Math.max(...terms.map(Math.abs))));
  const X = n => 50 + n * (W - 80) / N, Y = v => H / 2 - Math.max(-1.15 * m, Math.min(1.15 * m, v)) * (H / 2 - 22) / (1.15 * m);
  ctx.font = "12px IBM Plex Mono, monospace"; ctx.fillStyle = col("--muted"); ctx.strokeStyle = col("--line2"); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, H / 2); ctx.lineTo(W - 10, H / 2); ctx.stroke();
  for (let n = 0; n <= N; n += 5) ctx.fillText(n, X(n) - 4, H / 2 + 16);
  ctx.fillText("0", 24, H / 2 + 4);
  ctx.fillText(m.toFixed(m < 10 ? 1 : 0), 14, Y(m) + 4); ctx.fillText("-" + m.toFixed(m < 10 ? 1 : 0), 6, Y(-m) + 4);
  ctx.strokeStyle = col("--ac"); ctx.globalAlpha = .35; ctx.beginPath();
  terms.forEach((v, n) => n ? ctx.lineTo(X(n), Y(v)) : ctx.moveTo(X(n), Y(v))); ctx.stroke(); ctx.globalAlpha = 1;
  terms.forEach((v, n) => {
    ctx.fillStyle = Math.abs(v) > 1.15 * m ? col("--warn") : col("--ac");
    ctx.beginPath(); ctx.arc(X(n), Y(v), 4.5, 0, 7); ctx.fill();
  });
  let v;
  if (u0 === 0) v = "Tous les termes valent 0 : la suite converge vers <b>0</b>.";
  else if (Math.abs(q) < 1) v = `\\(|q|\\lt1\\) : \\(u_n\\to\\) <b>0</b>${q === 0 ? " (les termes valent 0 dès \\(n=1\\))" : q < 0 ? ", en alternant les signes" : ""}.`;
  else if (Math.abs(q - 1) < 1e-9) v = `\\(q=1\\) : suite constante, \\(u_n\\to\\) <b>${u0}</b>.`;
  else if (q > 1) v = `\\(q\\gt1\\) et \\(u_0${u0 > 0 ? "\\gt" : "\\lt"}0\\) : \\(u_n\\to\\) <b>${u0 > 0 ? "+∞" : "−∞"}</b>.`;
  else if (Math.abs(q + 1) < 1e-9) v = `\\(q=-1\\) : la suite alterne entre \\(${u0}\\) et \\(${-u0}\\), <b>pas de limite</b>.`;
  else v = `\\(q\\lt-1\\) : les rangs pairs et impairs divergent en sens opposés, <b>pas de limite</b>.`;
  const el = $("#g-v"); if (el.dataset.v !== v) { el.dataset.v = v; el.innerHTML = v; typeset(el); }
}
["g-u0", "g-q"].forEach(id => $("#" + id).addEventListener("input", drawGeo));

/* ---------- seuil ---------- */
function seuil() {
  const u0 = +$("#s-u0").value, q = +$("#s-q").value, A = +$("#s-a").value;
  const out = $("#s-out"), chips = $("#s-terms"), MAXN = 5000;
  let n = 0, u = u0; const t = [u];
  while (u < A && n < MAXN && isFinite(u)) { n++; u = u * q; if (t.length < 14) t.push(u); }
  const fmt = x => Math.abs(x) >= 1e9 ? x.toExponential(2) : String(+x.toFixed(6));
  if (u >= A) out.innerHTML = `Premier rang tel que \\(u_n\\ge ${A}\\) : <b>n = ${n}</b> (\\(u_{${n}}=${fmt(u)}\\)).`;
  else out.innerHTML = `Aucun terme n'atteint ${A} avant \\(n=${MAXN}\\) : la suite ne tend pas vers \\(+\\infty\\).`;
  chips.innerHTML = t.map((x, i) => `<span>u${i} = ${fmt(x)}</span>`).join("") + (n >= t.length ? "<span>…</span>" : "");
  typeset(out);
}
["s-u0", "s-q", "s-a"].forEach(id => $("#" + id).addEventListener("input", seuil));

/* ---------- calculatrice de dénombrement ---------- */
function big(n) { let f = 1n; for (let i = 2n; i <= BigInt(n); i++) f *= i; return f; }
function fmtBig(b) {
  const s = b.toString();
  if (s.length <= 30) return s.replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  return `≈ ${s[0]},${s.slice(1, 5)} × 10^${s.length - 1} (${s.length} chiffres)`;
}
function comb() {
  const n = Math.max(0, Math.min(200, parseInt($("#c-n").value) || 0)), p = Math.max(0, Math.min(200, parseInt($("#c-p").value) || 0));
  const pw = BigInt(n) ** BigInt(p);
  let A = 0n, C = 0n;
  if (p <= n) { A = 1n; for (let i = 0; i < p; i++) A *= BigInt(n - i); C = A / big(p); }
  const rows = [
    ["Liste avec répétitions  n^p", pw], ["Arrangements  A(n,p)", A], ["Combinaisons  C(n,p)", C],
    ["Permutations  n!", big(n)], ["Parties de E  2^n", 2n ** BigInt(n)]
  ];
  $("#c-out").innerHTML = rows.map(([l, v]) => `<div class="res"><span>${l}</span><b>${fmtBig(v)}</b></div>`).join("") +
    (p > n ? `<div class="res"><span>Remarque</span><b style="font-size:13px;font-family:var(--ui);color:var(--warn)">p &gt; n : A(n,p) = C(n,p) = 0</b></div>` : "");
}
["c-n", "c-p"].forEach(id => $("#" + id).addEventListener("input", comb));

/* ---------- triangle de Pascal ---------- */
function pascal(sel) {
  const N = +$("#pa-n").value; $("#pa-o").textContent = N;
  const T = []; for (let r = 0; r < N; r++) { T[r] = []; for (let c = 0; c <= r; c++) T[r][c] = c === 0 || c === r ? 1 : T[r - 1][c - 1] + T[r - 1][c]; }
  let h = "";
  for (let r = 0; r < N; r++) {
    h += `<div class="prow">`;
    for (let c = 0; c <= r; c++) {
      let cls = "";
      if (sel && sel[0] === r && sel[1] === c) cls = "s";
      else if (sel && sel[0] - 1 === r && (sel[1] === c || sel[1] - 1 === c) && sel[1] > 0 && sel[1] < sel[0]) cls = "p";
      h += `<button type="button" class="${cls}" data-r="${r}" data-c="${c}" aria-label="n=${r}, p=${c}, valeur ${T[r][c]}">${T[r][c]}</button>`;
    }
    h += `<em>= 2^${r}</em></div>`;
  }
  $("#pa-tri").innerHTML = h;
  const msg = $("#pa-msg");
  if (sel) {
    const [r, c] = sel;
    msg.innerHTML = c > 0 && c < r
      ? `\\(\\binom{${r}}{${c}}=\\binom{${r - 1}}{${c - 1}}+\\binom{${r - 1}}{${c}}=${T[r - 1][c - 1]}+${T[r - 1][c]}=${T[r][c]}\\)`
      : `\\(\\binom{${r}}{${c}}=1\\) : les bords du triangle valent 1.`;
    typeset(msg);
  }
}
$("#pa-n").addEventListener("input", () => pascal(null));
$("#pa-tri").addEventListener("click", e => {
  const b = e.target.closest("button"); if (b) pascal([+b.dataset.r, +b.dataset.c]); });

/* ---------- générateur de parties ---------- */
function parts() {
  const n = Math.max(1, Math.min(8, parseInt($("#pt-n").value) || 1)); const k = Math.min(+$("#pt-k").value, n);
  const L = [];
  (function go(start, cur) { if (cur.length === k) { L.push([...cur]); return; }
    for (let i = start; i <= n; i++) { cur.push(i); go(i + 1, cur); cur.pop(); } })(1, []);
  $("#pt-out").innerHTML = `Parties à ${k} élément${k > 1 ? "s" : ""} de \\(\\{1,\\dots,${n}\\}\\) : <b>${L.length}</b> \\(=\\binom{${n}}{${k}}\\).`;
  $("#pt-list").innerHTML = L.map(p => `<span>{${p.join(", ")}}</span>`).join("");
  typeset($("#pt-out"));
}
["pt-n", "pt-k"].forEach(id => $("#" + id).addEventListener("input", parts));

/* ---------- quiz ---------- */
const QUIZ = {
  q1: [
    ["Une suite croissante et non majorée…", ["tend vers \\(+\\infty\\)", "converge", "est constante", "n'a pas de limite"], 0, "Pour tout seuil \\(A\\), un rang \\(N\\) tel que \\(u_N\\gt A\\) existe, et la croissance garde \\(u_n\\gt A\\) ensuite."],
    ["Que vaut \\(\\lim \\dfrac{5n^2+4}{4n^2+3n}\\) ?", ["\\(+\\infty\\)", "\\(0\\)", "\\(\\tfrac54\\)", "\\(\\tfrac45\\)"], 2, "On factorise par \\(n^2\\) : \\(\\dfrac{5+4/n^2}{4+3/n}\\to\\dfrac54\\)."],
    ["La suite \\((-2)^n/3\\)…", ["tend vers \\(0\\)", "tend vers \\(-\\infty\\)", "n'a pas de limite", "tend vers \\(+\\infty\\)"], 2, "\\(q=-2\\le-1\\) : rangs pairs et impairs divergent en sens opposés."],
    ["\\(2^n-3^n\\) tend vers…", ["\\(0\\)", "\\(-\\infty\\)", "\\(+\\infty\\)", "\\(-1\\)"], 1, "On factorise par \\(3^n\\) : \\(3^n\\left[(2/3)^n-1\\right]\\) avec crochet \\(\\to-1\\) et \\(3^n\\to+\\infty\\)."],
    ["\\(\\sqrt{n+2}-\\sqrt n\\) tend vers…", ["\\(+\\infty\\)", "\\(0\\)", "\\(2\\)", "\\(1\\)"], 1, "Avec le conjugué : \\(\\dfrac2{\\sqrt{n+2}+\\sqrt n}\\to0\\)."],
    ["Laquelle est une forme indéterminée ?", ["\\(+\\infty+\\infty\\)", "\\(+\\infty\\times(-\\infty)\\)", "\\(+\\infty-\\infty\\)", "\\(\\tfrac3{+\\infty}\\)"], 2, "Les quatre formes indéterminées : \\(\\infty-\\infty\\), \\(0\\times\\infty\\), \\(\\tfrac\\infty\\infty\\), \\(\\tfrac00\\)."]
  ],
  q2: [
    ["3 entrées, 4 plats, 2 desserts : combien de menus ?", ["9", "24", "12", "14"], 1, "Principe multiplicatif : \\(3\\times4\\times2=24\\)."],
    ["Combien d'arrangements de 3 lettres parmi 5 ?", ["10", "125", "60", "120"], 2, "\\(A_5^3=5\\times4\\times3=60\\)."],
    ["Choisir 3 délégués de même rôle parmi 10 élèves :", ["\\(\\binom{10}3=120\\)", "\\(A_{10}^3=720\\)", "\\(10^3\\)", "\\(3!\\)"], 0, "Sans ordre ni répétition : combinaison, \\(\\dfrac{10\\times9\\times8}{3!}=120\\)."],
    ["Combien de parties possède un ensemble à 5 éléments ?", ["25", "10", "120", "32"], 3, "Deux choix par élément : \\(2^5=32\\)."],
    ["\\(\\binom72+\\binom73=\\)", ["\\(\\binom 95\\)", "\\(\\binom83\\)", "\\(\\binom{14}5\\)", "\\(\\binom 7 5\\)"], 1, "Relation de Pascal avec \\(n=7\\), \\(p=2\\) : \\(\\binom72+\\binom73=\\binom83=56\\)."],
    ["\\(\\binom{25}{24}=\\)", ["1", "24", "25", "600"], 2, "Symétrie : \\(\\binom{25}{24}=\\binom{25}1=25\\)."]
  ]
};
$$(".quiz").forEach(box => {
  const qs = QUIZ[box.dataset.quiz]; let score = 0, answered = 0;
  box.innerHTML = `<h3>Se tester</h3>` + qs.map((q, i) =>
    `<div class="qq" data-i="${i}"><p>${i + 1}. ${q[0]}</p><div class="opts">${q[1].map((o, j) => `<button type="button" class="opt" data-j="${j}">${o}</button>`).join("")}</div><p class="why" hidden>${q[3]}</p></div>`).join("") +
    `<div class="score" aria-live="polite">Score : 0 / ${qs.length}</div>`;
  box.addEventListener("click", e => {
    const b = e.target.closest(".opt"); if (!b) return;
    const qq = b.closest(".qq"), q = qs[+qq.dataset.i];
    if (qq.dataset.d) return; qq.dataset.d = 1; answered++;
    const ok = +b.dataset.j === q[2]; if (ok) score++;
    $$(".opt", qq).forEach(o => { o.disabled = true; if (+o.dataset.j === q[2]) o.classList.add("good"); });
    if (!ok) b.classList.add("bad");
    $(".why", qq).hidden = false; $(".score", box).textContent = `Score : ${score} / ${qs.length}` + (answered === qs.length ? " — terminé" : "");
  });
});

/* ---------- démarrage ---------- */
comb(); seuil(); parts(); pascal(null);
setTheme(store.get("mt-theme", "auto"), false);
$("#stats").innerHTML = [[CH.length, "chapitres"], [TOTAL, "sections"], [$$("details.proof").length, "démonstrations"], [$$(".widget").length + $$(".quiz").length, "outils et quiz"]]
  .map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join("");
show(location.hash.slice(1));
