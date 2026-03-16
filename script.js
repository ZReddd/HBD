// Page navigation
const pageIntro = document.getElementById("page-intro");
const pageCake = document.getElementById("page-cake");
const pageGift = document.getElementById("page-gift");

function showPage(page) {
  [pageIntro, pageCake, pageGift].forEach((p) =>
    p.classList.remove("page-active")
  );
  page.classList.add("page-active");
}

// Intro buttons -> cake
document.querySelectorAll(".btn-choice").forEach((btn) => {
  btn.addEventListener("click", () => showPage(pageCake));
});

// Cake logic
const cakeWrapper = document.getElementById("cake-wrapper");
const candles = document.querySelectorAll(".candle");
const micMessage = document.getElementById("mic-message");
const fallbackMessage = document.getElementById("fallback-message");
const btnNextGiftWrapper = document.getElementById("btn-next-gift-wrapper");
const btnNextGift = document.getElementById("btn-next-gift");
const flowerBurstContainer = document.getElementById("flower-burst");

let candleOut = false;
let micEnabled = true;

function setCandleOut() {
  if (candleOut) return;
  candleOut = true;
  candles.forEach((c) => c.classList.add("candle-out"));
  micMessage.textContent = "The candles are out! I hope your wish comes true ❤️";
  fallbackMessage.classList.add("hidden");
  btnNextGiftWrapper.classList.remove("hidden");
  triggerFlowerBurst();
  micEnabled = false;
  stopMic();
}

cakeWrapper.addEventListener("click", () => {
  if (!candleOut) {
    setCandleOut();
  }
});

btnNextGift.addEventListener("click", () => showPage(pageGift));

// Flower burst
function triggerFlowerBurst() {
  flowerBurstContainer.innerHTML = "";
  const count = 14;
  for (let i = 0; i < count; i++) {
    const flower = document.createElement("div");
    flower.className = `flower flower-${i % 7}`;
    flowerBurstContainer.appendChild(flower);
  }
  setTimeout(() => {
    flowerBurstContainer.innerHTML = "";
  }, 1600);
}

// Microphone blow detection (simple volume threshold)
let audioContext;
let analyser;
let source;
let rafId;
let overThresholdStart = null;

async function setupMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    micEnabled = false;
    fallbackMessage.classList.remove("hidden");
    micMessage.textContent =
      "Microphone is not available. You can tap the cake to blow out the candles ❤️";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    // Super sensitive: very low threshold & short duration
    const threshold = 0.03;
    const durationMs = 120;

    const loop = (time) => {
      if (!analyser || !micEnabled || candleOut) return;

      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const sample = dataArray[i] / 128 - 1.0;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      if (rms > threshold) {
        if (overThresholdStart === null) {
          overThresholdStart = time;
        } else if (time - overThresholdStart > durationMs) {
          setCandleOut();
          return;
        }
      } else {
        overThresholdStart = null;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
  } catch (e) {
    micEnabled = false;
    fallbackMessage.classList.remove("hidden");
    micMessage.textContent =
      "Microphone is not available. You can tap the cake to blow out the candles ❤️";
  }
}

function stopMic() {
  if (rafId) cancelAnimationFrame(rafId);
  if (source) {
    try {
      source.disconnect();
    } catch (e) {}
  }
  if (audioContext) {
    audioContext.close();
  }
  analyser = null;
  source = null;
  audioContext = null;
  overThresholdStart = null;
}

// Start mic when cake page first shown
if (pageCake.classList.contains("page-active")) {
  setupMic();
} else {
  const observer = new MutationObserver(() => {
    if (pageCake.classList.contains("page-active")) {
      setupMic();
      observer.disconnect();
    }
  });
  observer.observe(pageCake, { attributes: true, attributeFilter: ["class"] });
}

// Gift page: print & photos
document.getElementById("btn-print").addEventListener("click", () => {
  window.print();
});

const photos = [

  "photo1.jpg",
  "photo2.jpg",
  "photo3.jpg",
  "photo4.jpg",
  "photo5.jpg",
  "photo6.jpg",
];

const carouselFrame = document.getElementById("carousel-frame");
const carouselPrev = document.getElementById("carousel-prev");
const carouselCurrent = document.getElementById("carousel-current");
const carouselNext = document.getElementById("carousel-next");
const carouselEmpty = document.getElementById("carousel-empty");
const carouselDots = document.getElementById("carousel-dots");
const btnPrevPhoto = document.getElementById("btn-prev-photo");
const btnNextPhoto = document.getElementById("btn-next-photo");

let photoIndex = 0;

function renderCarousel() {
  if (!photos.length) {
    carouselEmpty.style.display = "flex";
    carouselPrev.style.display = "none";
    carouselCurrent.style.display = "none";
    carouselNext.style.display = "none";
    carouselDots.innerHTML = "";
    return;
  }
  carouselEmpty.style.display = "none";
  const len = photos.length;
  const prevIndex = (photoIndex - 1 + len) % len;
  const nextIndex = (photoIndex + 1) % len;

  [carouselPrev, carouselCurrent, carouselNext].forEach((img) => {
    img.style.display = "block";
  });

  carouselPrev.src = photos[prevIndex];
  carouselPrev.alt = `Photo ${prevIndex + 1}`;

  carouselCurrent.src = photos[photoIndex];
  carouselCurrent.alt = `Photo ${photoIndex + 1}`;

  carouselNext.src = photos[nextIndex];
  carouselNext.alt = `Photo ${nextIndex + 1}`;

  carouselDots.innerHTML = "";
  photos.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot" + (i === photoIndex ? " dot-active" : "");
    carouselDots.appendChild(dot);
  });
}

btnPrevPhoto.addEventListener("click", () => {
  if (!photos.length) return;
  photoIndex = (photoIndex - 1 + photos.length) % photos.length;
  renderCarousel();
});

btnNextPhoto.addEventListener("click", () => {
  if (!photos.length) return;
  photoIndex = (photoIndex + 1) % photos.length;
  renderCarousel();
});

renderCarousel();
