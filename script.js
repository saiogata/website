const menuButton = document.querySelector(".menu-button");
const siteNav = document.querySelector(".site-nav");
const hero = document.querySelector(".hero");
const heroVideo = document.querySelector(".hero-video");
const particleCanvas = document.querySelector(".particle-canvas");
const imageModal = document.querySelector(".image-modal");
const modalImage = imageModal?.querySelector("img");
const modalCaption = imageModal?.querySelector("figcaption");
const modalClose = imageModal?.querySelector(".modal-close");

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
    const isLarge = Math.random() > 0.82;
    const isTiny = !isLarge && Math.random() > 0.42;
    const size = isLarge
      ? 3.6 + Math.random() * 4.8
      : isTiny
        ? 0.55 + Math.random() * 1.45
        : 1.5 + Math.random() * 2.4;
    const maxLife = Math.random() > 0.58 ? 420 + Math.random() * 520 : 120 + Math.random() * 220;

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size,
      speed: 0.05 + Math.random() * 0.22,
      drift: -0.12 + Math.random() * 0.24,
      alpha: isLarge ? 0.18 + Math.random() * 0.26 : 0.2 + Math.random() * 0.4,
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
    const fadeIn = Math.min(1, lifeProgress * 7);
    const fadeOut = Math.min(1, (1 - lifeProgress) * 4);
    const pulse = 0.74 + Math.sin(particle.pulse) * 0.18;
    const alpha = particle.alpha * fadeIn * fadeOut * pulse;
    const gradient = ctx.createRadialGradient(
      particle.x,
      particle.y,
      0,
      particle.x,
      particle.y,
      particle.size * 4.2
    );

    gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 86%, ${alpha})`);
    gradient.addColorStop(0.35, `hsla(${particle.hue}, 100%, 72%, ${alpha * 0.58})`);
    gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 62%, 0)`);

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(particle.x, particle.y, particle.size * 4.2, 0, Math.PI * 2);
    ctx.fill();
  };

  const animate = () => {
    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
      particle.y -= particle.speed;
      particle.x += particle.drift;
      particle.age += 1;
      particle.pulse += 0.015;

      if (particle.y < -60 || particle.age >= particle.maxLife || particle.x < -80 || particle.x > width + 80) {
        Object.assign(particle, createParticle());
      }

      drawParticle(particle);
    }

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
