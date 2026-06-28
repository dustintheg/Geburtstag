const birthdayAge = 24;
const imageExtensions = ["JPG", "jpg", "JPEG", "jpeg", "PNG", "png", "HEIC", "heic", "WEBP", "webp", "AVIF", "avif"];
const galleryBases = Array.from({ length: 24 }, (_, index) => `bild${index + 2}`);

const revealTargets = document.querySelectorAll(".reveal");
const candles = Array.from(document.querySelectorAll("[data-candle]"));
const celebrationCard = document.querySelector("[data-age-card]");
const ageNumber = document.querySelector("[data-age-number]");
const galleryGrid = document.querySelector("[data-gallery-grid]");
const musicToggle = document.querySelector("[data-music-toggle]");
const backgroundAudio = document.querySelector("[data-background-audio]");

function candidateSources(baseName) {
  return imageExtensions.map((extension) => `assets/${baseName}.${extension}`);
}

function loadImageSlot(slot) {
  const baseName = slot.dataset.imageBase;
  if (!baseName) {
    return;
  }

  const image = slot.querySelector("[data-media-image]");
  const placeholder = slot.querySelector(".media-placeholder");
  const sources = candidateSources(baseName);
  let currentIndex = 0;

  const tryNext = () => {
    if (currentIndex >= sources.length) {
      slot.classList.add("has-error");
      return;
    }

    const source = sources[currentIndex];
    currentIndex += 1;

    image.onload = () => {
      image.hidden = false;
      placeholder.hidden = true;
      slot.classList.add("is-loaded");
    };
    image.onerror = tryNext;
    image.src = source;
  };

  tryNext();
}

function buildGallery() {
  if (!galleryGrid) {
    return;
  }

  const descriptions = [
    "Ein besonderer Moment.",
    "Ein ruhiger Augenblick.",
    "Ein weiterer Lieblingsplatz.",
    "Ein Panorama voller Erinnerungen.",
    "Ein letztes Lieblingsfoto.",
    "Ein warmer Blick zurück.",
  ];

  const fragment = document.createDocumentFragment();

  galleryBases.forEach((baseName, index) => {
    const figure = document.createElement("figure");
    figure.className = "gallery-card";
    figure.dataset.mediaSlot = "";
    figure.dataset.imageBase = baseName;

    const placeholder = document.createElement("div");
    placeholder.className = "media-placeholder media-placeholder--gallery";

    const label = document.createElement("span");
    label.textContent = `Bild ${index + 2}`;

    const description = document.createElement("p");
    description.textContent = descriptions[index % descriptions.length];

    const image = document.createElement("img");
    image.className = "media-image";
    image.dataset.mediaImage = "";
    image.alt = `Foto von Elisa, Bild ${index + 2}`;
    image.loading = "lazy";
    image.decoding = "async";
    image.hidden = true;

    placeholder.append(label, description);
    figure.append(placeholder, image);
    fragment.append(figure);
  });

  galleryGrid.replaceChildren(fragment);
}

function animateAgeNumber() {
  if (!ageNumber) {
    return;
  }

  const duration = 900;
  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    ageNumber.textContent = String(Math.max(1, Math.round(birthdayAge * progress)));

    if (progress < 1) {
      window.requestAnimationFrame(tick);
    } else {
      ageNumber.textContent = String(birthdayAge);
    }
  };

  ageNumber.textContent = "0";
  window.requestAnimationFrame(tick);
}

function revealCelebrationCard() {
  if (!celebrationCard || !celebrationCard.hidden) {
    return;
  }

  celebrationCard.hidden = false;
  window.requestAnimationFrame(() => {
    celebrationCard.classList.add("is-visible");
    animateAgeNumber();
    celebrationCard.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  });
}

function handleCandleClick(event) {
  const candle = event.currentTarget;
  candle.classList.add("is-out");
  candle.setAttribute("aria-pressed", "true");

  const remaining = candles.some((item) => !item.classList.contains("is-out"));
  if (!remaining) {
    window.setTimeout(revealCelebrationCard, 500);
  }
}

function setupRevealObserver() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -12% 0px",
    },
  );

  revealTargets.forEach((target) => observer.observe(target));
}

function setupMusicToggle() {
  if (!musicToggle || !backgroundAudio) {
    return;
  }

  backgroundAudio.loop = true;

  const updateButtonState = () => {
    if (backgroundAudio.paused) {
      musicToggle.textContent = "Musik starten";
      musicToggle.setAttribute("aria-pressed", "false");
    } else {
      musicToggle.textContent = backgroundAudio.muted ? "Musik an" : "Musik aus";
      musicToggle.setAttribute("aria-pressed", String(!backgroundAudio.muted));
    }
  };

  backgroundAudio.addEventListener("error", () => {
    musicToggle.textContent = "Musik optional";
    musicToggle.disabled = true;
    musicToggle.setAttribute("aria-pressed", "false");
  });

  backgroundAudio.addEventListener("play", () => {
    musicToggle.disabled = false;
    updateButtonState();
  });

  backgroundAudio.addEventListener("pause", updateButtonState);

  musicToggle.addEventListener("click", async () => {
    try {
      if (backgroundAudio.paused) {
        backgroundAudio.muted = false;
        await backgroundAudio.play();
      } else {
        backgroundAudio.muted = !backgroundAudio.muted;
      }
      updateButtonState();
    } catch {
      musicToggle.textContent = "Musik optional";
      musicToggle.disabled = true;
      musicToggle.setAttribute("aria-pressed", "false");
    }
  });
}

buildGallery();

const mediaSlots = document.querySelectorAll("[data-media-slot]");
mediaSlots.forEach(loadImageSlot);
candles.forEach((candle) => candle.addEventListener("click", handleCandleClick));

setupRevealObserver();
setupMusicToggle();
