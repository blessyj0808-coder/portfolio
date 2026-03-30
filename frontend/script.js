/* CURSOR */
const cur = document.getElementById("cur");
const cur2 = document.getElementById("cur2");
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
  if (cur) {
    cur.style.left = mx + "px";
    cur.style.top = my + "px";
  }
});

(function animC() {
  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  if (cur2) {
    cur2.style.left = rx + "px";
    cur2.style.top = ry + "px";
  }
  requestAnimationFrame(animC);
})();

/* ── BG CANVAS ── */
const bgC = document.getElementById("bg");
const bCtx = bgC.getContext("2d");
let W, H;
function resize() {
  W = (bgC.width = window.innerWidth);
  H = (bgC.height = window.innerHeight);
}
resize();
window.addEventListener("resize", resize);

const PARTS = [];
for (let i = 0; i < 140; i++) {
  PARTS.push({
    x: Math.random() * 3000,
    y: Math.random() * 3000,
    vx: (Math.random() - 0.5) * 0.7,
    vy: (Math.random() - 0.5) * 0.7,
    r: Math.random() * 2 + 0.3,
    op: Math.random() * 0.6 + 0.1,
    col: ["#00fff0", "#ff00aa", "#ffe600", "#39ff14", "#ff6200"][Math.floor(Math.random() * 5)],
  });
}

const LINES = [];
for (let i = 0; i < 100; i++) {
  LINES.push({
    x: Math.random() * 3000,
    y: Math.random() * 3000,
    len: Math.random() * 250 + 80,
    spd: Math.random() * 22 + 10,
    op: Math.random() * 0.45 + 0.04,
    w: Math.random() * 1.5 + 0.3,
    col: Math.random() > 0.65 ? "#ff00aa" : Math.random() > 0.4 ? "#00fff0" : "rgba(255,255,255,.6)",
  });
}

const BLOBS = [
  { x: 0.15, y: 0.2, r: 400, c: "rgba(0,255,240," },
  { x: 0.85, y: 0.6, r: 350, c: "rgba(255,0,170," },
  { x: 0.5, y: 0.88, r: 280, c: "rgba(255,230,0," },
  { x: 0.72, y: 0.12, r: 260, c: "rgba(57,255,20," },
];
let gOff = 0, mouseX = 0, mouseY = 0;
document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

/* Explosion sparks that burst on load */
const SPARKS = [];
for (let i = 0; i < 60; i++) {
  const a = Math.random() * Math.PI * 2;
  const s = Math.random() * 4 + 1;
  SPARKS.push({
    x: W * 0.5,
    y: H * 0.5,
    vx: Math.cos(a) * s,
    vy: Math.sin(a) * s,
    life: 1,
    col: ["#00fff0", "#ff00aa", "#ffe600"][Math.floor(Math.random() * 3)],
    r: Math.random() * 2 + 0.5,
  });
}

function drawBG() {
  bCtx.clearRect(0, 0, W, H);
  bCtx.fillStyle = "#04040a";
  bCtx.fillRect(0, 0, W, H);

  /* Nebulas */
  const t = Date.now() / 4000;
  BLOBS.forEach((b, i) => {
    const p = Math.sin(t + i) * 0.01 + 0.03;
    const g = bCtx.createRadialGradient(
      b.x * W,
      b.y * H,
      0,
      b.x * W,
      b.y * H,
      b.r * (1 + Math.sin(t + i) * 0.12),
    );
    g.addColorStop(0, b.c + p + ")");
    g.addColorStop(1, "transparent");
    bCtx.fillStyle = g;
    bCtx.fillRect(0, 0, W, H);
  });

  /* Perspective road grid */
  gOff = (gOff + 0.9) % 60;
  const vx = W / 2, vy = H * 0.5;
  bCtx.save();
  bCtx.globalAlpha = 0.08;
  for (let i = 0; i <= 22; i++) {
    const x = (W / 22) * i;
    bCtx.beginPath();
    bCtx.moveTo(vx, vy);
    bCtx.lineTo(x, H);
    bCtx.strokeStyle = "#00fff0";
    bCtx.lineWidth = 0.8;
    bCtx.stroke();
  }
  for (let i = 0; i < 14; i++) {
    const tt = (i / 14 + gOff / 840) % 1;
    const p = tt * tt;
    const yy = vy + (H - vy) * p;
    const xl = vx - vx * p;
    const xr = vx + (W - vx) * p;
    bCtx.beginPath();
    bCtx.moveTo(xl, yy);
    bCtx.lineTo(xr, yy);
    bCtx.strokeStyle = "#00fff0";
    bCtx.lineWidth = 0.6;
    bCtx.stroke();
  }
  bCtx.restore();

  /* Speed lines */
  LINES.forEach((l) => {
    bCtx.save();
    bCtx.globalAlpha = l.op;
    const g = bCtx.createLinearGradient(l.x - l.len, l.y, l.x, l.y);
    g.addColorStop(0, "transparent");
    g.addColorStop(1, l.col);
    bCtx.strokeStyle = g;
    bCtx.lineWidth = l.w;
    bCtx.beginPath();
    bCtx.moveTo(l.x - l.len, l.y);
    bCtx.lineTo(l.x, l.y);
    bCtx.stroke();
    bCtx.restore();
    l.x += l.spd;
    if (l.x > W + l.len) {
      l.x = -l.len;
      l.y = Math.random() * H;
      l.op = Math.random() * 0.45 + 0.04;
    }
  });

  /* Particles */
  PARTS.forEach((p) => {
    bCtx.save();
    bCtx.globalAlpha = p.op;
    bCtx.beginPath();
    bCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    bCtx.fillStyle = p.col;
    bCtx.fill();
    bCtx.restore();
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > W) p.vx *= -1;
    if (p.y < 0 || p.y > H) p.vy *= -1;
  });

  /* Mouse glow */
  if (mouseX || mouseY) {
    const mg = bCtx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 220);
    mg.addColorStop(0, "rgba(0,255,240,0.06)");
    mg.addColorStop(1, "transparent");
    bCtx.fillStyle = mg;
    bCtx.fillRect(0, 0, W, H);
  }

  /* Sparks */
  SPARKS.forEach((s) => {
    if (s.life > 0) {
      bCtx.save();
      bCtx.globalAlpha = s.life * 0.7;
      bCtx.beginPath();
      bCtx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2);
      bCtx.fillStyle = s.col;
      bCtx.fill();
      bCtx.restore();
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.04;
      s.life -= 0.015;
    }
  });

  /* Scanlines */
  bCtx.save();
  bCtx.globalAlpha = 0.025;
  for (let y = 0; y < H; y += 4) {
    bCtx.fillStyle = "#000";
    bCtx.fillRect(0, y, W, 2);
  }
  bCtx.restore();

  requestAnimationFrame(drawBG);
}
drawBG();

/* NAV */
const navEl = document.getElementById("nav");
window.addEventListener("scroll", () => navEl.classList.toggle("solid", scrollY > 30));
const ham = document.getElementById("ham");
const mob = document.getElementById("mobMenu");
ham.addEventListener("click", () => mob.classList.toggle("show"));
document.querySelectorAll(".mm").forEach((a) => a.addEventListener("click", () => mob.classList.remove("show")));

/* AVATAR IMAGE FALLBACK */
const avatarImg = document.getElementById("avatarImg");
const avatarCore = document.getElementById("avatarCore");
if (avatarImg && avatarCore) {
  const markNoImg = () => avatarCore.classList.add("no-img");
  avatarImg.addEventListener("error", markNoImg);
  // If it already failed to load (or file missing), naturalWidth will be 0.
  if (avatarImg.complete && avatarImg.naturalWidth === 0) markNoImg();
}

/* REVEALS */
const rvEls = document.querySelectorAll(".rv");
const rvObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("in");
    });
  },
  { threshold: 0.1 },
);
rvEls.forEach((el) => rvObserver.observe(el));

/* JOURNEY STEPS */
document.querySelectorAll(".jstep").forEach((j, i) => {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setTimeout(() => e.target.classList.add("in"), i * 130);
      });
    },
    { threshold: 0.1 },
  );
  obs.observe(j);
});

/* SKILL BARS */
let barsAnim = false;
const skillsCont = document.getElementById("skillsCont");
if (skillsCont) {
  const obs = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !barsAnim) {
        barsAnim = true;
        document.querySelectorAll(".skill-fill").forEach((b) => {
          const w = b.dataset.w;
          setTimeout(() => {
            b.style.width = w + "%";
          }, 200);
        });
      }
    },
    { threshold: 0.3 },
  );
  obs.observe(skillsCont);
}

/* TILT */
["tc2", "tc3"].forEach((id) => {
  const c = document.getElementById(id);
  if (!c) return;
  c.addEventListener("mousemove", (e) => {
    const r = c.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    c.style.transform = `perspective(800px) rotateX(${-(y / r.height) * 10}deg) rotateY(${(x / r.width) * 10}deg) translateZ(8px)`;
  });
  c.addEventListener("mouseleave", () => (c.style.transform = ""));
});

document.querySelectorAll(".gcar").forEach((c) => {
  c.addEventListener("mousemove", (e) => {
    const r = c.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    c.style.transform = `perspective(600px) rotateX(${-(y / r.height) * 6}deg) rotateY(${(x / r.width) * 6}deg) translateY(-6px)`;
  });
  c.addEventListener("mouseleave", () => (c.style.transform = ""));
});

/* HERO PARALLAX */
const heroSection = document.getElementById("hero");
const heroL = document.querySelector(".hero-left");
const heroR = document.querySelector(".hero-right");
heroSection.addEventListener("mousemove", (e) => {
  const dx = (e.clientX - W / 2) / W;
  const dy = (e.clientY - H / 2) / H;
  if (heroL) heroL.style.transform = `translate(${dx * 14}px,${dy * 8}px)`;
  if (heroR) heroR.style.transform = `translate(${dx * -18}px,${dy * -10}px)`;
});
heroSection.addEventListener("mouseleave", () => {
  if (heroL) heroL.style.transform = "";
  if (heroR) heroR.style.transform = "";
});

/* TYPEWRITER kicker */
const kickerEl = document.getElementById("kickerTxt");
const kickerTxt = "Portfolio 2025 — Live";
let ki = 0;
setInterval(() => {
  if (ki <= kickerTxt.length) kickerEl.textContent = kickerTxt.slice(0, ki++);
}, 70);

/* GLITCH on name */
function glitch() {
  [document.getElementById("gn1"), document.getElementById("gn2")].forEach((el) => {
    if (!el) return;
    el.style.filter = "hue-rotate(180deg) brightness(1.6)";
    el.style.transform = "skew(3deg)";
    setTimeout(() => {
      el.style.filter = "";
      el.style.transform = "";
    }, 80);
  });
}
setInterval(glitch, 3500);

/* CONTACT FORM */
const apiUrl = (document.querySelector('meta[name="api-url"]')?.getAttribute("content") || "").trim();
document.getElementById("csub").addEventListener("click", async () => {
  const n = document.getElementById("fName").value.trim();
  const e = document.getElementById("fEmail").value.trim();
  const m = document.getElementById("fMsg").value.trim();
  const s = document.getElementById("cstat");

  if (!n || !e || !m) {
    s.style.color = "var(--magenta)";
    s.textContent = "⚠ All fields required.";
    return;
  }

  if (!apiUrl) {
    s.style.color = "var(--magenta)";
    s.textContent = "⚠ Backend API URL is missing. Update <meta name='api-url'> in index.html.";
    return;
  }

  // Support multiple formats in `<meta name="api-url">`:
  // - "https://backend.onrender.com"
  // - "https://backend.onrender.com/api"
  // - "https://backend.onrender.com/api/contact"
  let endpoint = apiUrl.replace(/\/+$/, "");
  if (/\/api\/contact$/i.test(endpoint)) {
    // already the full path
  } else if (/\/api$/i.test(endpoint)) {
    endpoint = `${endpoint}/contact`;
  } else {
    endpoint = `${endpoint}/api/contact`;
  }

  s.style.color = "var(--cyan)";
  s.textContent = "⚡ Transmission sent! ETA: shortly.";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: n, email: e, message: m }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      const details = data && data.error ? `: ${data.error}` : "";
      throw new Error(`HTTP ${res.status}${details}`);
    }

    document.getElementById("fName").value = "";
    document.getElementById("fEmail").value = "";
    document.getElementById("fMsg").value = "";
    s.textContent = "✅ Message received. Thanks for reaching out!";
  } catch (err) {
    s.style.color = "var(--magenta)";
    s.textContent = `⚠ Transmission failed: ${String(err.message || err)}`;
    // Keep a console log for debugging endpoint issues.
    console.error("[contact] failed endpoint:", endpoint, err);
  } finally {
    setTimeout(() => {
      if (s) s.textContent = "";
    }, 4500);
  }
});

/* SMOOTH SCROLL */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const t = document.querySelector(a.getAttribute("href"));
    if (t) {
      e.preventDefault();
      t.scrollIntoView({ behavior: "smooth" });
    }
  });
});

/* NEON FLICKER */
document.querySelectorAll(".sec-kicker").forEach((el) => {
  setInterval(() => {
    if (Math.random() > 0.93) {
      el.style.opacity = "0.2";
      setTimeout(() => (el.style.opacity = "1"), 70);
    }
  }, 2000);
});

