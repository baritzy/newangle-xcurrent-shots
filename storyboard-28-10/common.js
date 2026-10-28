/* shared helpers for the storyboard pages (plain JS, no framework) */
(function () {
  const SB = (window.SB = {});
  const F = window.FILM;

  SB.esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  // escape, then mark placeholders like [XX V] so they stand out
  SB.ph = s => SB.esc(s).replace(/\[[^\]]+\]/g, m => '<mark class="ph">' + m + "</mark>");
  SB.tc = t => {
    const m = Math.floor(t / 60), s = t - m * 60;
    return String(m).padStart(2, "0") + ":" + (s < 10 ? "0" : "") + s.toFixed(1);
  };
  SB.EAGER = /[?&](pdf|print)\b/.test(location.search);

  // choices.json: {"T01":"A", ...}. Default is A for every moment. One-line change switches a moment to B.
  SB.loadChoices = async function (url) {
    const ch = {};
    Object.keys(F.moments).forEach(k => (ch[k] = "A"));
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        Object.keys(j).forEach(k => { if (ch[k] && (j[k] === "A" || j[k] === "B")) ch[k] = j[k]; });
      }
    } catch (e) { /* file:// or offline: keep defaults */ }
    return ch;
  };

  // film order -> beats -> items (moment cards and transition strips)
  SB.group = function () {
    const byNN = {};
    F.rows.forEach(r => (byNN[r.nn] = r));
    const beats = F.beats.map(b => ({ ...b, items: [], rows: [] }));
    const bk = {};
    beats.forEach(b => (bk[b.key] = b));
    F.rows.forEach(r => {
      const b = bk[r.beat];
      b.rows.push(r);
      const last = b.items[b.items.length - 1];
      if (r.tid) {
        if (last && last.type === "moment" && last.tid === r.tid) return;
        const order = F.moments[r.tid].rows.map(n => byNN[n]);
        b.items.push({ type: "moment", tid: r.tid, rows: order });
      } else if (last && last.type === "strip") last.rows.push(r);
      else b.items.push({ type: "strip", rows: [r] });
    });
    return { beats, byNN };
  };

  SB.img = function (base, file, opt) {
    opt = opt || {};
    const full = base + "images/" + file, th = base + "images/thumb/" + file;
    const lazy = SB.EAGER || opt.eager ? "eager" : "lazy";
    const srcset = opt.thumbOnly
      ? ""
      : ' srcset="' + th + " 640w, " + full + ' 1600w" sizes="' + (opt.sizes || "(max-width: 760px) 100vw, 1200px") + '"';
    return '<figure class="frame"><a href="' + full + '" class="zoom" data-cap="' + SB.esc(opt.cap || "") + '">' +
      '<img src="' + (opt.thumbOnly ? th : full) + '"' + srcset + ' width="1600" height="900" loading="' + lazy +
      '" decoding="async" alt="' + SB.esc(opt.alt || "") + '"></a>' +
      (opt.corners === false ? "" : '<i class="cn tl"></i><i class="cn tr"></i><i class="cn bl"></i><i class="cn br"></i>') +
      "</figure>";
  };

  // on-screen text block, English exactly as rendered on the frame
  SB.screen = function (lines) {
    let h = "", seenH = false, ruled = false;
    lines.forEach(([role, en]) => {
      if (role === "logo") h += '<div class="s-logo">' + SB.ph(en) + "</div>";
      else if (role === "h") { h += '<div class="s-h">' + SB.ph(en) + "</div>"; seenH = true; }
      else if (role === "d") {
        if (seenH && !ruled) { h += '<div class="s-rule"></div>'; ruled = true; }
        h += '<div class="s-d">' + SB.ph(en) + "</div>";
      } else h += '<div class="s-c"><span class="ldr"></span><span>' + SB.ph(en) + "</span></div>";
    });
    return '<div class="screen" lang="en">' + h + "</div>";
  };
  const ROLE = { logo: "לוגו", h: "כותרת", d: "נתונים", c: "תווית" };
  SB.heLines = function (lines) {
    return '<ol class="he-lines">' + lines.map(([role, , he]) =>
      '<li class="' + role + '"><span class="role">' + ROLE[role] + "</span><span>" + SB.ph(he) + "</span></li>").join("") + "</ol>";
  };
  SB.headline = function (lines) {
    const l = lines.find(x => x[0] === "h") || lines.find(x => x[0] === "c") || lines[0];
    return l ? l[1] : "";
  };

  // lightbox over every .zoom link on the page
  SB.lightbox = function () {
    const lb = document.getElementById("lb");
    if (!lb) return;
    const img = lb.querySelector("img"), cap = lb.querySelector("p");
    let list = [], i = 0, lastFocus = null;
    const show = k => {
      i = (k + list.length) % list.length;
      img.src = list[i].href;
      cap.textContent = list[i].dataset.cap || "";
    };
    const close = () => { lb.hidden = true; img.removeAttribute("src"); document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); };
    document.addEventListener("click", e => {
      const a = e.target.closest("a.zoom");
      if (a && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        list = Array.from(document.querySelectorAll("a.zoom"));
        lastFocus = a;
        show(list.indexOf(a));
        lb.hidden = false;
        document.body.style.overflow = "hidden";
        lb.querySelector(".x").focus();
        return;
      }
      const b = e.target.closest("[data-lb]");
      if (b) { const k = b.dataset.lb; k === "close" ? close() : show(i + (k === "next" ? 1 : -1)); return; }
      if (e.target === lb) close();
    });
    document.addEventListener("keydown", e => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(i + 1);   // RTL: left = next
      if (e.key === "ArrowRight") show(i - 1);
    });
  };

  // make lazy images load before the browser prints
  window.addEventListener("beforeprint", () => document.querySelectorAll('img[loading="lazy"]').forEach(im => (im.loading = "eager")));
})();
