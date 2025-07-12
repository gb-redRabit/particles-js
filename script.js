const options = {
    // Ustawienia Canvas
    idCanvas: "canvas",
    bgCanvas: "rgb(30, 30, 47)", // Domyślny kolor tła
    dynamicBackground: false,

    // Ustawienia cząsteczek
    colorParticle: "rgb(206, 27, 27)", // Kolor cząsteczek
    particleOpacity: 1,
    particleShape: "circle",
    sizeMin: 1.0,
    sizeMax: 3.0,
    numberOfParticles: Math.floor((innerWidth * innerHeight) / 6000),
    speed: 1,

    // Ustawienia linii łączących cząsteczki
    colorConnect: "rgb(170, 34, 255)", // Kolor linii
    lineWidthConnect: 0.3,
    connectDistance: 10000,

    // Ustawienia myszy
    mouseArea: 1.0, // Mnożnik pola myszy
    mouseShape: "circle", // Kształt pola myszy
    mouseInteractionMode: "repel", // Tryb interakcji myszy
    mouseMove: true, // Włączenie pola myszy
    showMouseArea: true, // Wizualizacja pola myszy

    // Inne ustawienia
    pauseOnBlur: true,
};

const canvas = document.getElementById(options.idCanvas);
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.backgroundColor = options.bgCanvas;

let particleArray = [];
let animationFrameId; // ID animacji
const mouse = {
  x: null,
  y: null,
  radius: calculateMouseRadius(),
};
let lastTime = 0; // Czas ostatniej klatki
let fps = 0; // Aktualny FPS

// Funkcja obliczająca promień myszy
function calculateMouseRadius() {
    return (canvas.height / 97) * (canvas.width / 97) * options.mouseArea;
}

// Obsługa ruchu myszki
window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Klasa reprezentująca cząsteczkę
class Particle {
  constructor(x, y, directionX, directionY, size, color) {
    this.x = x;
    this.y = y;
    this.directionX = directionX;
    this.directionY = directionY;
    this.size = size;
    this.color = color;
  }

  // Rysowanie cząsteczki
  draw() {
    ctx.beginPath();
    switch (options.particleShape) {
        case "circle":
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            break;
        case "square":
            ctx.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            break;
        case "triangle":
            ctx.moveTo(this.x, this.y - this.size);
            ctx.lineTo(this.x - this.size, this.y + this.size);
            ctx.lineTo(this.x + this.size, this.y + this.size);
            ctx.closePath();
            break;
        case "pentagon":
            const angle = (Math.PI * 2) / 5;
            for (let i = 0; i < 5; i++) {
                const x = this.x + this.size * Math.cos(i * angle - Math.PI / 2);
                const y = this.y + this.size * Math.sin(i * angle - Math.PI / 2);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            break;
    }
    ctx.fillStyle = `${options.colorParticle.replace("rgb", "rgba").replace(")", `,${options.particleOpacity})`)}`;
    ctx.fill();
  }

  // Aktualizacja pozycji cząsteczki
  update() {
    // Odbicie od krawędzi
    if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
    if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

    // Interakcja z myszką
    if (options.mouseMove && mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;

        switch (options.mouseShape) {
            case "circle":
                const distanceCircle = Math.sqrt(dx * dx + dy * dy);
                if (distanceCircle < mouse.radius + this.size) {
                    this.handleMouseInteraction();
                }
                break;

            case "square":
                if (
                    this.x > mouse.x - mouse.radius &&
                    this.x < mouse.x + mouse.radius &&
                    this.y > mouse.y - mouse.radius &&
                    this.y < mouse.y + mouse.radius
                ) {
                    this.handleMouseInteraction();
                }
                break;

            case "triangle":
                if (this.isInsideTriangle(mouse.x, mouse.y, mouse.radius)) {
                    this.handleMouseInteraction();
                }
                break;

            case "pentagon":
                if (this.isInsidePentagon(mouse.x, mouse.y, mouse.radius)) {
                    this.handleMouseInteraction();
                }
                break;
        }
    }

    // Aktualizacja pozycji
    this.x += this.directionX * options.speed;
    this.y += this.directionY * options.speed;

    this.draw();
  }

  // Obsługa interakcji z myszką
  handleMouseInteraction() {
    switch (options.mouseInteractionMode) {
        case "repel":
            if (mouse.x < this.x && this.x < canvas.width - this.size * 10) this.x += 1;
            if (mouse.x > this.x && this.x > this.size * 10) this.x -= 1;
            if (mouse.y < this.y && this.y < canvas.height - this.size * 10) this.y += 1;
            if (mouse.y > this.y && this.y > this.size * 10) this.y -= 1;
            break;

        case "attract":
            if (mouse.x > this.x && this.x < canvas.width - this.size * 10) this.x += 1;
            if (mouse.x < this.x && this.x > this.size * 10) this.x -= 1;
            if (mouse.y > this.y && this.y < canvas.height - this.size * 10) this.y += 1;
            if (mouse.y < this.y && this.y > this.size * 10) this.y -= 1;
            break;

        case "freeze":
            this.directionX = 0;
            this.directionY = 0;
            break;
    }
  }

  // Sprawdzenie, czy punkt znajduje się w trójkącie
  isInsideTriangle(mx, my, radius) {
    const ax = mx;
    const ay = my - radius;
    const bx = mx - radius;
    const by = my + radius;
    const cx = mx + radius;
    const cy = my + radius;

    const areaOrig = Math.abs((ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) / 2);
    const area1 = Math.abs((this.x * (by - cy) + bx * (cy - this.y) + cx * (this.y - by)) / 2);
    const area2 = Math.abs((ax * (this.y - cy) + this.x * (cy - ay) + cx * (ay - this.y)) / 2);
    const area3 = Math.abs((ax * (by - this.y) + bx * (this.y - ay) + this.x * (ay - by)) / 2);

    return areaOrig === area1 + area2 + area3;
  }

  // Sprawdzenie, czy punkt znajduje się w pięciokącie
  isInsidePentagon(mx, my, radius) {
    const angle = (Math.PI * 2) / 5;
    const vertices = [];
    for (let i = 0; i < 5; i++) {
      const x = mx + radius * Math.cos(i * angle - Math.PI / 2);
      const y = my + radius * Math.sin(i * angle - Math.PI / 2);
      vertices.push({ x, y });
    }

    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;

      const intersect = yi > this.y !== yj > this.y &&
        this.x < ((xj - xi) * (this.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }
}

// Funkcja łącząca cząsteczki liniami
const connect = () => {
    for (let a = 0; a < particleArray.length; a++) {
        for (let b = a + 1; b < particleArray.length; b++) {
            const dx = particleArray[a].x - particleArray[b].x;
            const dy = particleArray[a].y - particleArray[b].y;
            const distance = dx * dx + dy * dy;

            if (distance < options.connectDistance) {
                const opacityValue = 1 - distance / options.connectDistance;
                ctx.strokeStyle = `${options.colorConnect.replace("rgb", "rgba").replace(")", `,${opacityValue})`)}`;
                ctx.lineWidth = options.lineWidthConnect;
                ctx.beginPath();
                ctx.moveTo(particleArray[a].x, particleArray[a].y);
                ctx.lineTo(particleArray[b].x, particleArray[b].y);
                ctx.stroke();
            }
        }
    }
};

// Inicjalizacja cząsteczek
const init = () => {
  particleArray = [];
  for (let i = 0; i < options.numberOfParticles; i++) {
    const size = Math.random() * (options.sizeMax - options.sizeMin) + options.sizeMin;
    const x = Math.random() * (canvas.width - size * 2) + size;
    const y = Math.random() * (canvas.height - size * 2) + size;
    const directionX = Math.random() * 2 - 1;
    const directionY = Math.random() * 2 - 1;

    particleArray.push(new Particle(x, y, directionX, directionY, size, options.colorParticle));
  }
};

// Funkcja do aktualizacji ustawień
function updateSettings() {
    // Funkcja konwertująca HEX na RGB
    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Aktualizacja koloru tła
    options.bgCanvas = hexToRgb(document.getElementById("bgCanvas").value);
    canvas.style.backgroundColor = options.bgCanvas;

    // Aktualizacja innych ustawień
    options.colorParticle = hexToRgb(document.getElementById("colorParticle").value);
    options.colorConnect = hexToRgb(document.getElementById("colorConnect").value);
    options.numberOfParticles = parseInt(document.getElementById("numberOfParticles").value, 10);
    options.speed = parseFloat(document.getElementById("speed").value);
    options.sizeMin = parseFloat(document.getElementById("sizeMin").value);
    options.sizeMax = parseFloat(document.getElementById("sizeMax").value);
    options.particleShape = document.getElementById("particleShape").value;
    options.dynamicBackground = document.getElementById("dynamicBackground").checked;
    options.lineWidthConnect = parseFloat(document.getElementById("lineWidthConnect").value);
    options.particleOpacity = parseFloat(document.getElementById("particleOpacity").value);

    // Aktualizacja ustawień myszy
    options.mouseArea = parseFloat(document.getElementById("mouseArea").value);
    options.mouseShape = document.getElementById("mouseShape").value;
    options.mouseInteractionMode = document.getElementById("mouseInteractionMode").value;
    options.mouseMove = document.getElementById("mouseMove").checked;
    options.showMouseArea = document.getElementById("showMouseArea").checked;

    // Aktualizacja promienia myszy
    mouse.radius = calculateMouseRadius();

    // Ponowna inicjalizacja cząsteczek
    init();
}

// Aktualizacja dynamicznych wartości suwaków
function updateSliderValues() {
    console.log("Aktualizacja wartości suwaków...");

    const numberOfParticlesValue = document.getElementById("numberOfParticlesValue");
    if (!numberOfParticlesValue) {
        console.error("Element #numberOfParticlesValue nie istnieje!");
    } else {
        numberOfParticlesValue.textContent = options.numberOfParticles;
    }

    const speedValue = document.getElementById("speedValue");
    if (speedValue) {
        speedValue.textContent = options.speed.toFixed(1);
    }

    const sizeMinValue = document.getElementById("sizeMinValue");
    if (sizeMinValue) {
        sizeMinValue.textContent = options.sizeMin.toFixed(1);
    }

    const sizeMaxValue = document.getElementById("sizeMaxValue");
    if (sizeMaxValue) {
        sizeMaxValue.textContent = options.sizeMax.toFixed(1);
    }

    const lineWidthConnectValue = document.getElementById("lineWidthConnectValue");
    if (lineWidthConnectValue) {
        lineWidthConnectValue.textContent = options.lineWidthConnect.toFixed(1);
    }

    const connectDistanceValue = document.getElementById("connectDistanceValue");
    if (connectDistanceValue) {
        connectDistanceValue.textContent = options.connectDistance;
    }

    const mouseAreaValue = document.getElementById("mouseAreaValue");
    if (mouseAreaValue) {
        mouseAreaValue.textContent = options.mouseArea.toFixed(1);
    }

    const particleOpacityValue = document.getElementById("particleOpacityValue");
    if (particleOpacityValue) {
        particleOpacityValue.textContent = options.particleOpacity.toFixed(1);
    }
}

// Wywołanie aktualizacji po każdej zmianie ustawień
document.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", () => {
        updateSettings();
        updateSliderValues();
    });
});

// Inicjalizacja wartości suwaków
updateSliderValues();

// Obsługa zdarzeń dla nowych kontrolek
document.getElementById("numberOfParticles").addEventListener("input", updateSettings);
document.getElementById("speed").addEventListener("input", updateSettings);
document.getElementById("sizeMin").addEventListener("input", updateSettings);
document.getElementById("sizeMax").addEventListener("input", updateSettings);
document.getElementById("particleShape").addEventListener("change", updateSettings);
document.getElementById("dynamicBackground").addEventListener("change", updateSettings);
document.getElementById("colorParticle").addEventListener("input", updateSettings);
document.getElementById("colorConnect").addEventListener("input", updateSettings);
document.getElementById("lineWidthConnect").addEventListener("input", updateSettings);
document.getElementById("particleOpacity").addEventListener("input", updateSettings);
document.getElementById("mouseArea").addEventListener("input", updateSettings);
document.getElementById("mouseShape").addEventListener("change", updateSettings);
document.getElementById("mouseMove").addEventListener("change", updateSettings);
document.getElementById("showMouseArea").addEventListener("change", updateSettings);
document.getElementById("connectDistance").addEventListener("input", updateSettings);
document.getElementById("pauseOnBlur").addEventListener("change", updateSettings);
document.getElementById("mouseInteractionMode").addEventListener("change", updateSettings);

window.addEventListener("load", () => {
    const mouseMoveCheckbox = document.getElementById("mouseMove");
    if (mouseMoveCheckbox) {
        mouseMoveCheckbox.addEventListener("change", updateSettings);
    } else {
        console.error("Element #mouseMove nie istnieje w DOM.");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const showMouseAreaCheckbox = document.getElementById("showMouseArea");
    if (showMouseAreaCheckbox) {
        showMouseAreaCheckbox.addEventListener("change", updateSettings);
    } else {
        console.error("Element #showMouseArea nie istnieje w DOM.");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    function rgbToHex(rgb) {
        const result = rgb.match(/\d+/g).map((num) => {
            const hex = parseInt(num).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        });
        return `#${result.join("")}`;
    }

    document.getElementById("bgCanvas").value = rgbToHex(options.bgCanvas);
    document.getElementById("colorParticle").value = rgbToHex(options.colorParticle);
    document.getElementById("colorConnect").value = rgbToHex(options.colorConnect);
    document.getElementById("numberOfParticles").value = options.numberOfParticles;
    document.getElementById("speed").value = options.speed;
    document.getElementById("sizeMin").value = options.sizeMin;
    document.getElementById("sizeMax").value = options.sizeMax;
    document.getElementById("particleShape").value = options.particleShape;
    document.getElementById("dynamicBackground").checked = options.dynamicBackground;
    document.getElementById("lineWidthConnect").value = options.lineWidthConnect;
    document.getElementById("particleOpacity").value = options.particleOpacity;

    // Inicjalizacja ustawień myszy
    document.getElementById("mouseArea").value = options.mouseArea;
    document.getElementById("mouseShape").value = options.mouseShape;
    document.getElementById("mouseInteractionMode").value = options.mouseInteractionMode;
    document.getElementById("mouseMove").checked = options.mouseMove;
    document.getElementById("showMouseArea").checked = options.showMouseArea;
});

// Obsługa przełącznika motywu jasny/ciemny
document.getElementById("themeToggle").addEventListener("change", (e) => {
    if (e.target.checked) {
        document.body.classList.add("light-mode");
        document.body.classList.remove("dark-mode");
    } else {
        document.body.classList.add("dark-mode");
        document.body.classList.remove("light-mode");
    }
});

// Ustawienie domyślnego motywu na podstawie preferencji użytkownika
document.addEventListener("DOMContentLoaded", () => {
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const themeToggle = document.getElementById("themeToggle");

    if (prefersDarkMode) {
        document.body.classList.add("dark-mode");
        themeToggle.checked = false;
    } else {
        document.body.classList.add("light-mode");
        themeToggle.checked = true;
    }
});

// Funkcja konwertująca kolor RGB na HEX
function rgbToHex(rgb) {
    const result = rgb.match(/\d+/g).map((num) => {
        const hex = parseInt(num).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    });
    return `#${result.join("")}`;
}

// Animacja
const animate = (timestamp) => {
  if (!lastTime) {
    lastTime = timestamp; // Inicjalizacja lastTime przy pierwszym wywołaniu
  }

  if (options.dynamicBackground) {
    const r = Math.floor(50 + 50 * Math.sin(Date.now() * 0.001));
    const g = Math.floor(50 + 50 * Math.sin(Date.now() * 0.002));
    const b = Math.floor(50 + 50 * Math.sin(Date.now() * 0.003));
    canvas.style.backgroundColor = `rgb(${r},${g},${b})`;
  } else {
    canvas.style.backgroundColor = options.bgCanvas;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Obliczanie FPS
  const delta = timestamp - lastTime;
  fps = Math.round(1000 / delta);
  lastTime = timestamp;

  // Rysowanie licznika FPS
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "16px Arial";
  ctx.textAlign = "right"; // Wyrównanie tekstu do prawej
  ctx.fillText(`FPS: ${fps}`, canvas.width - 10, 20); // Pozycja w prawym górnym rogu

  // Rysowanie pola myszki, jeśli opcja jest włączona
  if (options.showMouseArea && mouse.x && mouse.y) {
    ctx.beginPath();
    switch (options.mouseShape) {
        case "circle":
            ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
            break;
        case "square":
            ctx.rect(mouse.x - mouse.radius, mouse.y - mouse.radius, mouse.radius * 2, mouse.radius * 2);
            break;
        case "triangle":
            ctx.moveTo(mouse.x, mouse.y - mouse.radius);
            ctx.lineTo(mouse.x - mouse.radius, mouse.y + mouse.radius);
            ctx.lineTo(mouse.x + mouse.radius, mouse.y + mouse.radius);
            ctx.closePath();
            break;
        case "pentagon":
            const angle = (Math.PI * 2) / 5;
            for (let i = 0; i < 5; i++) {
                const x = mouse.x + mouse.radius * Math.cos(i * angle - Math.PI / 2);
                const y = mouse.y + mouse.radius * Math.sin(i * angle - Math.PI / 2);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            break;
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  particleArray.forEach((particle) => particle.update());
  connect();

  animationFrameId = requestAnimationFrame(animate);
};

// Obsługa zmiany widoczności karty
if (options.pauseOnBlur) {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationFrameId);
    } else {
      animate();
    }
  });
}

// Obsługa zmiany rozmiaru okna
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  mouse.radius = calculateMouseRadius();
  init();
});

// Obsługa wyjścia myszki poza obszar
window.addEventListener("mouseout", () => {
  mouse.x = undefined;
  mouse.y = undefined;
});

// Uruchomienie
document.addEventListener("DOMContentLoaded", () => {
    init();
    animate();
});
