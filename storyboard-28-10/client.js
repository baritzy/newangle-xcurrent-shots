/* client page renderer (simple, image-first): reads film-data.js + choices.json, shows only the chosen option per moment */
(async function () {
  const F = window.FILM, SB = window.SB, $ = id => document.getElementById(id);
  const choices = await SB.loadChoices("choices.json");

  // headline shown in small mono under a text moment (English as on the frame)
  function mono(lines) {
    const h = lines.filter(l => l[0] === "h").map(l => l[1]);
    if (h.length) return h.join(" ");
    const d = lines.find(l => l[0] === "d") || lines.find(l => l[0] === "c") || lines[0];
    return d ? d[1] : "";
  }

  function tile(r, opt) {
    const tc = SB.tc(r.t);
    return '<figure class="ft">' + SB.img("", r.img[opt], { thumbOnly: true, corners: false, cap: tc + " · " + r.sc, alt: tc + " " + r.sc }) +
      '<figcaption><span class="tc">' + tc + "</span>" + SB.esc(r.sc) + "</figcaption></figure>";
  }

  function moment(r) {
    const m = F.moments[r.tid], opt = choices[r.tid], o = m[opt], tc = SB.tc(r.t);
    return '<article class="fm" id="m-' + r.tid + '">' +
      SB.img("", r.img[opt], { cap: tc + " · " + r.sc, alt: tc + " " + r.sc, sizes: "(max-width: 760px) 100vw, 820px" }) +
      '<div class="fm-txt"><div class="fm-top"><span class="tc">' + tc + "</span>" +
      (m.optional ? '<span class="opt">אופציונלי</span>' : "") + "</div>" +
      '<p class="fm-sc">' + SB.esc(r.sc) + "</p>" +
      '<p class="fm-en" lang="en">' + SB.ph(mono(o.lines)) + "</p>" +
      '<p class="fm-he">' + SB.ph(m.mean[opt]) + "</p></div></article>";
  }

  // film order, grouped by beat
  const byBeat = {};
  F.rows.forEach(r => (byBeat[r.beat] = byBeat[r.beat] || []).push(r));
  $("beats").innerHTML = F.beats.map((b, i) => {
    const rows = byBeat[b.key] || [];
    return '<section class="beat c-beat" id="beat-' + i + '"><div class="c-bh"><span class="beat-letter">' + b.key + "</span><h2>" + SB.esc(b.short) + "</h2></div>" +
      '<div class="fgrid">' + rows.map(r => (r.tid && F.moments[r.tid].rows[0] === r.nn ? moment(r) : tile(r, r.tid ? choices[r.tid] : "A"))).join("") +
      "</div></section>";
  }).join("");

  // nav
  let nav = '<a href="#system">מערכת הטקסט</a><span class="sp"></span>';
  F.beats.forEach((b, i) => (nav += '<a class="beat" href="#beat-' + i + '" title="' + SB.esc(b.short) + '">' + b.key + "</a>"));
  nav += '<span class="sp"></span><a href="#questions">שאלות</a>';
  $("nav").innerHTML = nav;

  // questions, one line each
  $("qs").innerHTML = F.qshort.map((q, i) => {
    const n = i + 1, txt = q === "__T12__" ? F.q14short[choices.T12] : q;
    return '<li id="q-' + n + '"><span class="qn">' + n + "</span><span>" + txt + "</span></li>";
  }).join("");

  SB.lightbox();

  // nav highlight
  const links = Array.from(document.querySelectorAll(".nav a"));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
    const on = links.find(a => a.classList.contains("on"));
    if (on && window.innerWidth < 760) on.parentNode.scrollLeft = on.offsetLeft - 40;
  }), { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("#system, .c-beat, #questions").forEach(s => io.observe(s));

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
