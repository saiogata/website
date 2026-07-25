/* ==========================================================
   OgataChannel with AI — v3 "DEEP DIVE" interactions
   ========================================================== */
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- boot sequence ---------- */
const bootDone = (() => {
  const boot = document.querySelector(".boot");
  const linesBox = document.getElementById("boot-lines");
  const bar = document.getElementById("boot-bar");
  const pct = document.getElementById("boot-pct");
  const callbacks = [];
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    boot.classList.add("done");
    document.body.classList.remove("boot-lock");
    try { sessionStorage.setItem("ogata-booted", "1"); } catch {}
    callbacks.forEach((cb) => cb());
  };

  let skip = REDUCED;
  try { skip = skip || sessionStorage.getItem("ogata-booted") === "1"; } catch {}

  if (skip) {
    boot.style.transition = "none";
    boot.classList.add("done");
    finished = true;
  } else {
    document.body.classList.add("boot-lock");
    const LINES = [
      "> INITIALIZING NIGHT GRID ....",
      "> G-PARTICLE ENGINE ......... <b>OK</b>",
      "> L.I.B.R.A. LINK ........... <b>ESTABLISHED</b>",
      "> AR LAYER 07 ............... <b>SYNCED</b>",
    ];
    LINES.forEach((html, i) => {
      window.setTimeout(() => {
        const p = document.createElement("p");
        p.innerHTML = html;
        linesBox.appendChild(p);
      }, 150 + i * 320);
    });

    let value = 0;
    const tick = window.setInterval(() => {
      value = Math.min(100, value + 4 + Math.random() * 9);
      bar.style.width = `${value}%`;
      pct.textContent = String(Math.floor(value)).padStart(3, "0");
      if (value >= 100) {
        window.clearInterval(tick);
        window.setTimeout(finish, 380);
      }
    }, 70);
    // hard safety: never trap the visitor behind the overlay
    window.setTimeout(finish, 4200);
  }

  return {
    then(cb) { finished ? cb() : callbacks.push(cb); },
  };
})();

/* ---------- custom cursor ---------- */
(() => {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  let mx = -100, my = -100, rx = -100, ry = -100;

  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
  }, { passive: true });

  const HOVER = "a, button, input, textarea, label, [data-hover]";
  const VIEW = ".db-card, .work-row, .chisat-specs button, .feed-panel";
  const label = ring.querySelector(".cursor-label");

  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(HOVER)) ring.classList.add("is-hover");
    const viewer = e.target.closest(VIEW);
    if (viewer) {
      ring.classList.add("is-view");
      if (label) label.textContent = "VIEW";
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(HOVER)) ring.classList.remove("is-hover");
    if (e.target.closest(VIEW)) ring.classList.remove("is-view");
  });

  const loop = () => {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    const size = ring.offsetWidth / 2;
    ring.style.transform = `translate(${rx - size}px, ${ry - size}px)`;
    requestAnimationFrame(loop);
  };
  if (!REDUCED) loop();
})();

/* ---------- depth field (pseudo-3D point wave) ---------- */
(() => {
  const canvas = document.getElementById("depth-field");
  const ctx = canvas.getContext("2d");
  let w, h, cx, horizon;

  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    cx = w / 2;
    horizon = h * 0.42;
  };
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("load", resize);

  const FL = 320;           // focal length
  const SP = 46;            // grid spacing
  const COLS = 64;
  const ROWS = 30;
  const MAXZ = ROWS * SP;

  let mouseX = 0, mouseY = 0, camX = 0, camY = 0;
  document.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / w - 0.5) * 2;
    mouseY = (e.clientY / h - 0.5) * 2;
  }, { passive: true });

  const draw = (t) => {
    if (w === 0 || h === 0) resize(); // viewport may initialize late
    ctx.clearRect(0, 0, w, h);
    camX += (mouseX * 60 - camX) * 0.04;
    camY += (mouseY * 26 - camY) * 0.04;

    for (let j = 1; j <= ROWS; j++) {
      const z = j * SP;
      const persp = FL / (FL + z);
      const depth = 1 - z / MAXZ;
      for (let i = 0; i <= COLS; i++) {
        const x = (i - COLS / 2) * SP;
        const y =
          150 +
          Math.sin(x * 0.011 + t * 0.0009) * 26 +
          Math.cos(z * 0.008 - t * 0.0006) * 22 +
          Math.sin((x + z) * 0.004 + t * 0.0004) * 14;

        const sx = cx + (x - camX) * persp;
        const sy = horizon + (y - camY) * persp;
        if (sx < -8 || sx > w + 8 || sy > h + 8) continue;

        const size = Math.max(0.5, 2.4 * persp);
        const cold = i % 7 === 0;
        const alpha = 0.06 + depth * depth * 0.6;
        ctx.fillStyle = cold
          ? `rgba(0, 224, 255, ${alpha})`
          : `rgba(64, 130, 255, ${alpha * 0.85})`;
        ctx.fillRect(sx, sy, size, size);
      }
    }
    requestAnimationFrame(draw);
  };

  if (REDUCED) {
    draw(0); // static single frame (rAF continues but transitions are off anyway)
  } else {
    requestAnimationFrame(draw);
  }
})();

/* ---------- text scramble ---------- */
const scramble = (() => {
  const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&";
  return (el) => {
    if (REDUCED || el.dataset.scrambled) return;
    el.dataset.scrambled = "1";
    const original = el.textContent;
    const len = original.length;
    let frame = 0;
    const total = Math.max(18, len * 2.2);

    const step = () => {
      frame++;
      const settled = Math.floor((frame / total) * len);
      let out = "";
      for (let i = 0; i < len; i++) {
        if (original[i] === " ") { out += " "; continue; }
        out += i < settled
          ? original[i]
          : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (settled < len) requestAnimationFrame(step);
      else el.textContent = original;
    };
    requestAnimationFrame(step);
  };
})();

/* ---------- hero sequence ----------
   boot → intro movie fullscreen (~6s) → movie crossfades into the key
   visual, logo slams in, UI staggers up. Skips ahead if the video errors
   or autoplay is blocked. */
bootDone.then(() => {
  const video = document.querySelector(".hero-bgv");
  const typeEl = document.getElementById("typeline");
  // the break splits it into two vertical columns
  const TEXT = "人とAIが出会うとき、\n物語は動き出す。";
  let revealed = false;

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    document.body.classList.add("hero-in");
    if (video) {
      video.classList.add("is-gone");
      window.setTimeout(() => video.pause(), 1700); // after crossfade
    }

    // typewriter catchcopy
    if (REDUCED) {
      typeEl.textContent = TEXT;
    } else {
      let i = 0;
      const type = () => {
        typeEl.textContent = TEXT.slice(0, ++i);
        if (i < TEXT.length) window.setTimeout(type, 65);
      };
      window.setTimeout(type, 900);
    }

    // hero scramble titles
    document.querySelectorAll(".hero [data-scramble]").forEach((elm, idx) => {
      window.setTimeout(() => scramble(elm), 300 + idx * 160);
    });
  };

  if (!video || REDUCED) {
    reveal();
    return;
  }

  let started = false;
  video.addEventListener("playing", () => {
    if (started) return;
    started = true;
    window.setTimeout(reveal, 6000);
  });
  video.addEventListener("ended", reveal, { once: true });
  video.addEventListener("error", reveal, { once: true });
  // autoplay blocked or the video never starts → skip straight to the KV
  window.setTimeout(() => {
    if (!started) reveal();
  }, 2500);

  // play from frame one so the intro is seen in full after the boot screen
  try { video.currentTime = 0; } catch {}
  video.play().catch(() => {});
});

/* ---------- reveal + nav active + suit scrollytelling ---------- */
(() => {
  let revealEls = [...document.querySelectorAll(".reveal")];
  const scrambleEls = [...document.querySelectorAll("[data-scramble]")].filter(
    (el) => !el.closest(".hero")
  );
  const railLinks = [...document.querySelectorAll(".rail-nav a")];
  const sections = railLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  /* suit scrollytelling elements */
  const SUITS = [
    {
      ver: "VER.1.0 / PRIMORDIAL", name: "原初型",
      desc: "最初のスーツ。私服にG粒子機構を搭載した、活動の始点となるフォーム。",
      tags: "FIRST SUIT / GHOST PARTICLE DEVICE",
      stats: [30, 20, 25, 10],
    },
    {
      ver: "VER.2.0 / PHANTOM", name: "隠密型",
      desc: "ホルニッセ・ツヴァイ、ヴァイパー、シュピネ。G塗料タンク量と噴射力を強化したステルス寄りのスーツ。",
      tags: "STEALTH / HORNISSE ZWEI / VIPER / SPINNE",
      stats: [85, 40, 35, 30],
    },
    {
      ver: "VER.3.0 / WOLF", name: "近接特化型",
      desc: "第4物質形態「Gプラズマ」を解放。Gクロウ、Gパルス、水月による近接戦闘へ拡張。",
      tags: "MELEE / G-PLASMA / MIZUKI BLADE",
      stats: [55, 35, 95, 55],
    },
    {
      ver: "VER.4.0 / NIGHTHAWK", name: "遠距離隠密特化型",
      desc: "チサトと完全同期するL.I.B.R.A. Systemを搭載。攻撃予測、情報解析、空中戦を軸にした現在の姿。",
      tags: "LONG RANGE / L.I.B.R.A. SYSTEM / CHISAT SYNC",
      stats: [90, 95, 50, 100],
    },
  ];
  const suitSection = document.getElementById("suits");
  const layers = [...document.querySelectorAll(".suit-layer")];
  const nodes = [...document.querySelectorAll(".ver-node")];
  const verProgress = document.getElementById("ver-progress");
  const sEls = {
    ver: document.getElementById("s3-ver"),
    name: document.getElementById("s3-name"),
    desc: document.getElementById("s3-desc"),
    tags: document.getElementById("s3-tags"),
  };
  const sBars = [0, 1, 2, 3].map((i) => document.getElementById(`s3-st${i}`));
  let activeSuit = -1;

  // hall-of-armor slots: selected suit takes center stage, the rest line
  // up left-to-right in version order along the back wall
  const SLOTS = ["pos-center", "back-0", "back-1", "back-2"];

  const applySuit = (idx) => {
    if (idx === activeSuit) return;
    activeSuit = idx;
    const s = SUITS[idx];
    layers.forEach((l) => l.classList.remove(...SLOTS));
    layers[idx].classList.add("pos-center");
    layers
      .filter((_, i) => i !== idx)
      .forEach((l, k) => l.classList.add(`back-${k}`));
    nodes.forEach((n, i) => n.classList.toggle("is-on", i <= idx));
    sEls.ver.textContent = s.ver;
    sEls.name.textContent = s.name;
    sEls.desc.textContent = s.desc;
    sEls.tags.textContent = s.tags;
    sBars.forEach((b, i) => (b.style.width = `${s.stats[i]}%`));
  };

  const update = () => {
    const vh = window.innerHeight;

    /* reveals */
    revealEls = revealEls.filter((el) => {
      if (el.getBoundingClientRect().top < vh * 0.92) {
        el.classList.add("visible");
        return false;
      }
      return true;
    });

    /* section title scramble */
    for (const el of scrambleEls) {
      if (!el.dataset.scrambled && el.getBoundingClientRect().top < vh * 0.9) {
        scramble(el);
      }
    }

    /* nav active */
    let current = null;
    for (const s of sections) {
      if (s.getBoundingClientRect().top <= vh * 0.45) current = s.id;
    }
    railLinks.forEach((a) =>
      a.classList.toggle("active", a.dataset.sec === current)
    );

    /* suit progress */
    if (suitSection) {
      const rect = suitSection.getBoundingClientRect();
      const scrollable = rect.height - vh;
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      verProgress.style.width = `${progress * 100}%`;
      applySuit(Math.min(3, Math.floor(progress * 4)));
    }
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  window.addEventListener("load", update);
  applySuit(0);
  update();
})();

/* ---------- WORKS spotlight ----------
   each artwork gets a second, full-colour copy revealed through a radial
   mask that tracks the cursor */
(() => {
  document.querySelectorAll(".work-visual").forEach((visual) => {
    const base = visual.querySelector("img");
    if (!base) return;

    const spot = base.cloneNode();
    spot.classList.add("work-spot");
    spot.removeAttribute("loading");
    spot.alt = "";
    spot.setAttribute("aria-hidden", "true");
    visual.appendChild(spot);

    const row = visual.closest(".work-row") || visual;
    row.addEventListener("mousemove", (e) => {
      const r = visual.getBoundingClientRect();
      visual.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      visual.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
})();

/* ---------- BGM spectrum analyser ---------- */
const audioViz = (() => {
  const canvas = document.getElementById("viz");
  const audio = document.querySelector(".bgm-audio");
  if (!canvas || !audio) return { start() {} };

  const ctx2d = canvas.getContext("2d");
  let analyser = null;
  let data = null;
  let running = false;
  let w = 0, h = 0;

  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = canvas.offsetHeight || 120;
  };
  resize();
  window.addEventListener("resize", resize);

  const toggles = [...document.querySelectorAll(".bgm-toggle")];
  const eqBars = toggles.map((t) => [...t.querySelectorAll(".bgm-eq i")]);

  const draw = () => {
    if (!running) return;
    analyser.getByteFrequencyData(data);
    ctx2d.clearRect(0, 0, w, h);

    const BARS = Math.min(96, Math.floor(w / 14));
    const gap = 3;
    const bw = w / BARS - gap;

    for (let i = 0; i < BARS; i++) {
      // log-ish spread so the low end doesn't dominate the whole bar
      const idx = Math.floor(Math.pow(i / BARS, 1.5) * (data.length * 0.7));
      const v = data[idx] / 255;
      const bh = Math.max(2, v * v * h * 0.92);
      const x = i * (bw + gap);

      const grad = ctx2d.createLinearGradient(0, h, 0, h - bh);
      grad.addColorStop(0, `rgba(0, 224, 255, ${0.16 + v * 0.5})`);
      grad.addColorStop(1, `rgba(31, 109, 255, ${0.04 + v * 0.28})`);
      ctx2d.fillStyle = grad;
      ctx2d.fillRect(x, h - bh, bw, bh);

      // bright cap riding the top of each bar
      ctx2d.fillStyle = `rgba(180, 245, 255, ${0.25 + v * 0.65})`;
      ctx2d.fillRect(x, h - bh, bw, 1.5);
    }

    // feed the little EQ icon on the BGM button with real levels
    const lows = [0, 1, 2, 3].map((k) => {
      const from = Math.floor((data.length * 0.05) + k * 12);
      let sum = 0;
      for (let j = from; j < from + 10; j++) sum += data[j] || 0;
      return sum / 10 / 255;
    });
    eqBars.forEach((bars) =>
      bars.forEach((b, k) => (b.style.height = `${3 + lows[k] * 9}px`))
    );

    requestAnimationFrame(draw);
  };

  const start = () => {
    if (running) return;
    try {
      if (!analyser) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const actx = new AC();
        const src = actx.createMediaElementSource(audio);
        analyser = actx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.78;
        data = new Uint8Array(analyser.frequencyBinCount);
        src.connect(analyser);
        analyser.connect(actx.destination);
        audio.__actx = actx;
      }
      if (audio.__actx && audio.__actx.state === "suspended") audio.__actx.resume();
      running = true;
      resize();
      canvas.classList.add("is-live");
      toggles.forEach((t) => t.classList.add("is-live"));
      requestAnimationFrame(draw);
    } catch {
      /* analyser unavailable — the CSS-animated EQ stays as the fallback */
    }
  };

  const stop = () => {
    running = false;
    canvas.classList.remove("is-live");
    toggles.forEach((t) => {
      t.classList.remove("is-live");
      t.querySelectorAll(".bgm-eq i").forEach((b) => (b.style.height = ""));
    });
    ctx2d.clearRect(0, 0, w, h);
  };

  return { start, stop };
})();

/* ---------- magnetic buttons ---------- */
(() => {
  if (REDUCED || !window.matchMedia("(pointer: fine)").matches) return;
  const PULL = 0.18;
  const CAP = 12; // keep it a nudge, not a slide
  const clamp = (v) => Math.max(-CAP, Math.min(CAP, v));

  document.querySelectorAll(".btn").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${clamp(dx * PULL)}px, ${clamp(dy * PULL)}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "";
      window.setTimeout(() => (el.style.transition = ""), 450);
    });
  });
})();

/* ---------- backdrop parallax + rail progress ---------- */
(() => {
  const city = document.querySelector(".city-img");
  const bar = document.querySelector(".rail-progress b");
  let mx = 0, my = 0, cx = 0, cy = 0, sy = 0;

  if (!REDUCED) {
    document.addEventListener("mousemove", (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * -18;
      my = (e.clientY / window.innerHeight - 0.5) * -12;
    }, { passive: true });
  }

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(max, 1)));
    // keep the drift small so the horizon never slides off screen
    sy = (progress - 0.5) * 56;
    if (bar) bar.style.height = `${progress * 100}%`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const loop = () => {
    cx += (mx - cx) * 0.06;
    cy += (my - cy) * 0.06;
    if (city) {
      // slow vertical drift keeps the skyline alive without moving the horizon far
      city.style.transform = `translate3d(${cx}px, ${cy + sy}px, 0)`;
    }
    requestAnimationFrame(loop);
  };
  if (REDUCED) { onScroll(); } else { loop(); }
})();

/* ---------- ghost particles rising from the suit platform ---------- */
(() => {
  const canvas = document.querySelector(".gp-canvas");
  const stage = document.querySelector(".suit-visual3");
  const floor = document.querySelector(".suit-floor");
  if (!canvas || !stage || !floor) return;
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, fx = 0, fy = 0, fw = 200;

  const resize = () => {
    const r = stage.getBoundingClientRect();
    w = canvas.width = Math.max(1, r.width);
    h = canvas.height = Math.max(1, r.height);
    const fr = floor.getBoundingClientRect();
    fx = fr.left - r.left + fr.width / 2;  // emitter center = platform center
    fy = fr.top - r.top + fr.height / 2;
    fw = fr.width * 0.72;
  };
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("load", resize);

  const P = [];
  const COUNT = 54;
  const spawn = (p) => {
    p.x = fx + (Math.random() - 0.5) * fw;
    p.y = fy - Math.random() * 8;
    p.vx = (Math.random() - 0.5) * 0.3;
    p.vy = -(0.35 + Math.random() * 1.05);
    p.life = 0;
    p.max = 110 + Math.random() * 150;
    p.r = 0.6 + Math.random() * 2.1;
    p.cyan = Math.random() < 0.72;
  };
  for (let i = 0; i < COUNT; i++) {
    const p = {};
    spawn(p);
    p.life = Math.random() * p.max; // desync
    P.push(p);
  }

  const draw = () => {
    if (w <= 1) resize();
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (const p of P) {
      p.x += p.vx + Math.sin((p.life + p.r * 40) * 0.045) * 0.22; // waft
      p.y += p.vy;
      p.life += 1;
      if (p.life >= p.max || p.y < h * 0.1) spawn(p);
      const t = p.life / p.max;
      const a = Math.sin(Math.PI * t) * 0.62;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.cyan
        ? `rgba(0, 224, 255, ${a})`
        : `rgba(120, 170, 255, ${a * 0.8})`;
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    if (!REDUCED) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
})();

/* ---------- tilt cards ---------- */
(() => {
  if (REDUCED || !window.matchMedia("(pointer: fine)").matches) return;
  const MAX = 7;

  document.querySelectorAll(".tilt").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.transform =
        `perspective(760px) rotateX(${(0.5 - py) * MAX}deg) rotateY(${(px - 0.5) * MAX}deg)`;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    });
    el.addEventListener("mouseleave", () => {
      el.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "none";
      window.setTimeout(() => (el.style.transition = ""), 500);
    });
  });
})();

/* ---------- log strip drag scroll ---------- */
(() => {
  const strip = document.getElementById("log-strip");
  if (!strip) return;
  let down = false, startX = 0, startScroll = 0;

  strip.addEventListener("pointerdown", (e) => {
    down = true;
    startX = e.clientX;
    startScroll = strip.scrollLeft;
    strip.classList.add("dragging");
    strip.setPointerCapture(e.pointerId);
  });
  strip.addEventListener("pointermove", (e) => {
    if (!down) return;
    strip.scrollLeft = startScroll - (e.clientX - startX);
  });
  const release = () => {
    down = false;
    strip.classList.remove("dragging");
  };
  strip.addEventListener("pointerup", release);
  strip.addEventListener("pointercancel", release);
})();

/* ---------- modal (image + video) ---------- */
(() => {
  const modal = document.querySelector(".modal");
  const img = modal.querySelector("img");
  const video = modal.querySelector("video");
  const caption = modal.querySelector("figcaption");
  const closeBtn = modal.querySelector(".modal-close");

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-full], [data-video]");
    if (!btn) return;
    const title = btn.dataset.title || "";
    if (btn.dataset.video) {
      video.src = btn.dataset.video;
      video.hidden = false;
      img.hidden = true;
      video.muted = false;
      video.play().catch(() => {});
    } else {
      img.src = btn.dataset.full;
      img.alt = title;
      img.hidden = false;
      video.hidden = true;
    }
    caption.textContent = title;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  });

  const close = () => {
    modal.hidden = true;
    video.pause();
    video.removeAttribute("src");
    img.src = "";
    document.body.style.overflow = "";
  };
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
})();

/* ---------- BGM (rail + mobile buttons share one audio) ---------- */
(() => {
  const audio = document.querySelector(".bgm-audio");
  const toggles = [...document.querySelectorAll(".bgm-toggle")];
  if (!audio || !toggles.length) return;

  audio.volume = 0.3;

  const setState = (playing) => {
    toggles.forEach((t) => {
      t.classList.toggle("is-playing", playing);
      t.setAttribute("aria-pressed", String(playing));
      const text = t.querySelector(".bgm-toggle-text");
      if (text) text.textContent = playing ? "BGM ON" : "BGM OFF";
    });
  };

  toggles.forEach((t) =>
    t.addEventListener("click", async () => {
      if (audio.paused) {
        try { await audio.play(); } catch { setState(false); }
      } else {
        audio.pause();
      }
    })
  );
  audio.addEventListener("play", () => {
    setState(true);
    audioViz.start();
  });
  audio.addEventListener("pause", () => {
    setState(false);
    audioViz.stop();
  });
  setState(false);
})();

/* ---------- mobile menu ---------- */
(() => {
  const btn = document.querySelector(".mobile-menu-btn");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;

  const setOpen = (open) => {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  btn.addEventListener("click", () => setOpen(menu.hidden));
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
})();
