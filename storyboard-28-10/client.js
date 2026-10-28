/* client page renderer: reads film-data.js + choices.json, shows only the chosen option per moment */
(async function () {
  const F = window.FILM, SB = window.SB, $ = id => document.getElementById(id);
  const choices = await SB.loadChoices("choices.json");
  const { beats } = SB.group();

  // which moments touch each question (for back-links)
  const qRefs = {};
  Object.entries(F.moments).forEach(([tid, m]) => m.q.forEach(n => (qRefs[n] = qRefs[n] || []).push(tid)));

  function momentHTML(it) {
    const m = F.moments[it.tid], opt = choices[it.tid], o = m[opt], main = it.rows[0];
    const cap = it.tid + " · " + SB.tc(main.t);
    let h = '<article class="moment" id="m-' + it.tid + '">';
    h += '<div class="m-head"><span class="m-id">' + it.tid + '</span><span class="m-tc">' + SB.tc(main.t) + "</span>" +
      '<span class="m-sec"><b>' + o.sec.toFixed(1) + "</b>שניות על המסך</span>" +
      (m.optional ? '<span class="m-opt">אופציונלי</span>' : "") +
      '<span class="m-headline">' + SB.esc(SB.headline(o.lines)) + "</span></div>";
    h += SB.img("", main.img[opt], { cap: cap, alt: "פריים " + cap });
    if (it.rows.length > 1) {
      h += '<div class="subframes">' + it.rows.slice(1).map(r =>
        "<figure>" + SB.img("", r.img[opt], { thumbOnly: true, corners: false, cap: it.tid + " · " + SB.tc(r.t), alt: "פריים " + SB.tc(r.t) }) +
        '<figcaption><span class="tcs">' + SB.tc(r.t) + "</span>" + SB.esc(r.cap) + "</figcaption></figure>").join("") + "</div>";
    }
    h += '<div class="m-body">';
    h += '<div class="m-text"><h3 class="lbl">על המסך <span class="en">ON SCREEN</span></h3>' + SB.screen(o.lines) +
      '<h3 class="lbl" style="margin-top:14px">תרגום</h3>' + SB.heLines(o.lines) + "</div>";
    h += '<div class="m-shot"><h3 class="lbl">השוט</h3><p>' + SB.esc(main.shot) + '</p><h3 class="lbl">מצלמה</h3><p>' + SB.esc(main.cam) + "</p></div>";
    h += '<div class="m-anim"><h3 class="lbl">אנימציה</h3><ol class="steps">' + m.anim.map(a => "<li>" + SB.ph(a) + "</li>").join("") + "</ol></div>";
    h += "</div>";
    if (m.q.length) h += '<div class="m-q">שאלות שנוגעות לרגע הזה:' + m.q.map(n => '<a href="#q-' + n + '">' + n + "</a>").join("") + "</div>";
    return h + "</article>";
  }

  function stripHTML(it, lead) {
    const n = it.rows.length;
    return '<div class="strip ' + (lead ? "lead" : "tail") + '"><div class="strip-label">מעבר · ' + n + (n === 1 ? " פריים" : " פריימים") + '</div><div class="strip-row">' +
      it.rows.map(r => '<figure class="tf">' + SB.img("", r.img.A, { thumbOnly: true, cap: SB.tc(r.t) + " · " + r.cap, alt: "פריים מעבר " + SB.tc(r.t) }) +
        '<figcaption><span class="tcs">' + SB.tc(r.t) + "</span>" + SB.esc(r.cap) + "</figcaption></figure>").join("") + "</div></div>";
  }

  // nav
  let nav = '<a href="#system">מערכת הטקסט</a><span class="sp"></span>';
  beats.forEach((b, i) => (nav += '<a class="beat" href="#beat-' + i + '" title="' + SB.esc(b.title) + '">' + b.key + "</a>"));
  nav += '<span class="sp"></span><a href="#questions">שאלות</a>';
  $("nav").innerHTML = nav;

  // film
  $("beats").innerHTML = beats.map((b, i) => {
    const t0 = b.rows[0].t, t1 = b.rows[b.rows.length - 1].t;
    return '<section class="beat" id="beat-' + i + '"><div class="beat-head"><span class="beat-letter">' + b.key + "</span><div><h2>" +
      SB.esc(b.title) + '</h2><span class="range">' + SB.tc(t0) + (t1 > t0 ? " → " + SB.tc(t1) : "") + "</span></div></div>" +
      b.items.map((it, j) => (it.type === "moment" ? momentHTML(it) : stripHTML(it, (b.items[j + 1] || {}).type === "moment"))).join("") + "</section>";
  }).join("");

  // questions
  $("qs").innerHTML = F.questions.map((q, i) => {
    const n = i + 1, txt = q === "__T12__" ? F.q14[choices.T12] : q;
    const refs = (qRefs[n] || []).map(t => '<a href="#m-' + t + '">' + t + "</a>").join("");
    return '<li id="q-' + n + '"><span class="qn">' + String(n).padStart(2, "0") + "</span><div>" + txt + "</div>" +
      (refs ? '<div class="refs">ברגעים: ' + refs + "</div>" : "") + "</li>";
  }).join("");

  // stats
  const nText = Object.keys(F.moments).length, nFrames = F.rows.length, nTrans = F.rows.filter(r => !r.tid).length;
  $("stats").innerHTML = [["1:33", "אורך השלד"], [nText, "רגעי טקסט"], [nTrans, "פריימי מעבר"], [nFrames, "פריימים בסך הכל"], [F.questions.length, "שאלות תוכן"]]
    .map(([b, s]) => '<div class="stat"><b>' + b + "</b><span>" + s + "</span></div>").join("");

  SB.lightbox();

  // nav highlight
  const links = Array.from(document.querySelectorAll(".nav a"));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
    const on = links.find(a => a.classList.contains("on"));
    if (on && on.scrollIntoView && window.innerWidth < 760) on.parentNode.scrollLeft = on.offsetLeft - 40;
  }), { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("#system, .beat, #questions").forEach(s => io.observe(s));

  if (location.hash) { const t = document.querySelector(location.hash); if (t) t.scrollIntoView(); }
  window.SB_READY = true;
})();

/* motion demo: the verbatim motion system, looped */
(function () {
  const d = document.getElementById("demo");
  if (!d || !d.animate) return;
  const q = s => d.querySelector(s), E = "cubic-bezier(.2,.7,.2,1)";
  const lead = q("#d-lead"), L = lead.getTotalLength();
  const kms = Array.from(d.querySelectorAll(".km")), labs = Array.from(d.querySelectorAll("#d-kml text"));
  const all = [q("#d-anchor"), lead, q("#d-lab"), q("#d-eye"), q("#d-h"), q("#d-rule"), q("#d-data"), q("#d-stat"), q("#d-nodes")].concat(kms, labs);
  const DATA = "AUTO-DETECT · AUTO-MATCH";
  let timers = [], anims = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const A = (el, kf, o) => anims.push(el.animate(kf, Object.assign({ fill: "forwards", easing: E }, o)));
  function reset() {
    timers.forEach(clearTimeout); anims.forEach(a => a.cancel()); timers = []; anims = [];
    all.forEach(el => (el.style.opacity = 0));
    q("#d-data").textContent = ""; q("#d-num").textContent = "0";
  }
  function run() {
    reset();
    const show = el => (el.style.opacity = 1);
    at(200, () => { show(q("#d-anchor")); A(q("#d-anchor"), [{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration: 150 }); });
    at(350, () => { show(lead); lead.style.strokeDasharray = L; A(lead, [{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 300 }); });
    at(650, () => A(q("#d-lab"), [{ opacity: 0 }, { opacity: 1 }], { duration: 200 }));
    at(900, () => A(q("#d-eye"), [{ opacity: 0 }, { opacity: 1 }], { duration: 200 }));
    at(1100, () => A(q("#d-h"), [{ opacity: 1, clipPath: "inset(0 100% 0 0)" }, { opacity: 1, clipPath: "inset(0 0 0 0)" }], { duration: 350 }));
    at(1450, () => A(q("#d-rule"), [{ opacity: 1, transform: "scaleX(0)" }, { opacity: 1, transform: "scaleX(1)" }], { duration: 250 }));
    at(1600, () => {
      const el = q("#d-data"); el.style.opacity = 1; let i = 0;
      const iv = setInterval(() => { el.textContent = DATA.slice(0, ++i); if (i >= DATA.length) clearInterval(iv); }, 20);
      timers.push(iv);
    });
    at(2300, () => { show(q("#d-nodes")); A(q("#d-nodes"), [{ opacity: 0 }, { opacity: 1 }], { duration: 150 }); });
    kms.forEach((k, i) => at(2450 + i * 250, () => {
      const len = k.getTotalLength(); k.style.opacity = 1; k.style.strokeDasharray = len;
      A(k, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 250, easing: "linear" });
      at(125, () => A(labs[i], [{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], { duration: 150 }));
    }));
    at(2500, () => {
      const el = q("#d-stat"), n = q("#d-num"); el.style.opacity = 1; const t0 = performance.now();
      const step = t => { const p = Math.min(1, (t - t0) / 600); n.textContent = Math.round(8 * p); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
    at(6200, () => {
      anims.push(lead.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: L }], { duration: 250, fill: "forwards" }));
      all.filter(el => el !== lead).forEach(el => anims.push(el.animate([{ opacity: getComputedStyle(el).opacity }, { opacity: 0 }], { duration: 250, fill: "forwards" })));
    });
    at(7600, run);
  }
  function finalState() {
    reset();
    all.forEach(el => (el.style.opacity = 1));
    q("#d-data").textContent = DATA; q("#d-num").textContent = "8";
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || /[?&](pdf|print)\b/.test(location.search)) { finalState(); return; }
  window.addEventListener("beforeprint", finalState);
  document.getElementById("replay").addEventListener("click", run);
  let started = false;
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && !started) { started = true; run(); }
    else if (!e.isIntersecting && started) { started = false; finalState(); }
  }), { threshold: 0.3 }).observe(d);
  finalState();
})();
