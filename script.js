const menuButton = document.querySelector(".menu-button");
const siteNav = document.querySelector(".site-nav");
const hero = document.querySelector(".hero");
const heroVideo = document.querySelector(".hero-video");
const particleCanvas = document.querySelector(".particle-canvas");
const imageModal = document.querySelector(".image-modal");
const modalImage = imageModal?.querySelector("img");
const modalCaption = imageModal?.querySelector("figcaption");
const modalClose = imageModal?.querySelector(".modal-close");

document.documentElement.classList.add("motion-ready");

menuButton?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

siteNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

const revealHero = () => {
  hero?.classList.add("is-ready");
  heroVideo?.classList.add("is-faded");
};

if (heroVideo) {
  heroVideo.addEventListener("ended", revealHero, { once: true });
  heroVideo.addEventListener("error", revealHero, { once: true });
  window.setTimeout(revealHero, 5200);
} else {
  revealHero();
}

document.querySelectorAll(".section-heading h2, .suit-copy h3, .work-card h3, .world-system-card h3, .ai-card h3").forEach((heading) => {
  heading.classList.add("glitch-title");
  heading.dataset.text = heading.textContent.trim();
});

document.querySelectorAll(`
  .section-heading,
  .profile-panel,
  .link-panel,
  .purpose-panel,
  .career-intro,
  .channel-timeline article,
  .world-system-lead,
  .world-system-card,
  .suit-card,
  .ai-card,
  .work-card,
  .contact-copy,
  .contact-form
`).forEach((element, index) => {
  element.classList.add("reveal-node");
  element.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`);
});

document.querySelectorAll(`
  .profile-panel,
  .link-panel,
  .purpose-panel,
  .career-intro,
  .world-system-card,
  .suit-card,
  .ai-card,
  .work-card,
  .contact-copy,
  .contact-form
`).forEach((element) => {
  element.classList.add("scan-panel");
});

document.querySelectorAll(`
  .world-image-button,
  .suit-portrait,
  .ai-main > img,
  .spec-grid figure,
  .work-image,
  .purpose-icon
`).forEach((element) => {
  element.classList.add("digital-image");
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  rootMargin: "0px 0px -12% 0px",
  threshold: 0.16,
});

document.querySelectorAll(".reveal-node, .digital-image").forEach((element) => {
  revealObserver.observe(element);
});

document.querySelectorAll(".suit-portrait, .world-image-button").forEach((button) => {
  button.addEventListener("click", () => {
    const fullImage = button.dataset.full;
    const title = button.dataset.title || "";

    if (!imageModal || !modalImage || !modalCaption || !fullImage) return;

    modalImage.src = fullImage;
    modalImage.alt = title;
    modalCaption.textContent = title;
    imageModal.hidden = false;
    modalClose?.focus();
  });
});

const closeImageModal = () => {
  if (imageModal) {
    imageModal.hidden = true;
  }
};

modalClose?.addEventListener("click", closeImageModal);
imageModal?.addEventListener("click", (event) => {
  if (event.target === imageModal) {
    closeImageModal();
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeImageModal();
  }
});

if (particleCanvas) {
  const ctx = particleCanvas.getContext("2d", { alpha: true });
  const particles = [];
  let width = 0;
  let height = 0;
  let dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    particleCanvas.width = Math.floor(width * dpr);
    particleCanvas.height = Math.floor(height * dpr);
    particleCanvas.style.width = `${width}px`;
    particleCanvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const createParticle = () => {
    const isLarge = Math.random() > 0.9;
    const isTiny = !isLarge && Math.random() > 0.34;
    const size = isLarge
      ? 2.2 + Math.random() * 2.6
      : isTiny
        ? 0.35 + Math.random() * 0.9
        : 0.9 + Math.random() * 1.45;
    const maxLife = Math.random() > 0.58 ? 620 + Math.random() * 760 : 260 + Math.random() * 420;

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size,
      speed: 0.018 + Math.random() * 0.075,
      drift: -0.045 + Math.random() * 0.09,
      alpha: isLarge ? 0.16 + Math.random() * 0.22 : 0.16 + Math.random() * 0.28,
      age: Math.random() * maxLife,
      maxLife,
      hue: 252 + Math.random() * 28,
      pulse: Math.random() * Math.PI * 2,
    };
  };

  const seed = () => {
    particles.length = 0;
    const count = Math.min(92, Math.max(36, Math.floor((width * height) / 23500)));
    for (let i = 0; i < count; i += 1) {
      particles.push(createParticle());
    }
  };

  const drawParticle = (particle) => {
    const lifeProgress = particle.age / particle.maxLife;
    const fadeIn = Math.min(1, lifeProgress * 4.2);
    const fadeOut = Math.min(1, (1 - lifeProgress) * 2.4);
    const pulse = 0.78 + Math.sin(particle.pulse) * 0.14;
    const alpha = particle.alpha * fadeIn * fadeOut * pulse;
    const glowRadius = particle.size * 3.35;
    const gradient = ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      glowRadius
    );

    gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 86%, ${alpha})`);
    gradient.addColorStop(0.35, `hsla(${particle.hue}, 100%, 72%, ${alpha * 0.58})`);
    gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 62%, 0)`);

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  };

  const animate = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    for (const particle of particles) {
      particle.y -= particle.speed;
      particle.x += particle.drift;
      particle.age += 1;
      particle.pulse += 0.009;

      if (particle.y < -60 || particle.age >= particle.maxLife || particle.x < -80 || particle.x > width + 80) {
        Object.assign(particle, createParticle());
      }

      drawParticle(particle);
    }

    ctx.globalCompositeOperation = "source-over";
    window.requestAnimationFrame(animate);
  };

  resize();
  seed();
  window.addEventListener("resize", () => {
    resize();
    seed();
  });
  animate();
}
