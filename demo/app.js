import { attachLiquidGlass } from "../skills/apple-glass/assets/kit/liquid-lens.js";

// ---------- Content ----------
const picks = [
  ["a1035.jpg", "Made for You", "Morning Light Mix", "Mara Lind, Sol & Shore, Okun and more", "#3b5f7a"],
  ["a1069.jpg", "New Music", "Blue Hour", "Lumen, Juniper Vale, North Arcade", "#1d3f8f"],
  ["a184.jpg", "Station", "Desert Drive Radio", "Long roads, low synths", "#6b3a22"],
  ["a152.jpg", "Playlist", "Wildflower", "Soft folk for slow afternoons", "#4a3a6b"],
  ["a164.jpg", "Up Next", "Harbor Lights", "Theo Marsh", "#3d6b6a"],
];
const recent = [
  ["a1016.jpg", "Ember", "Ivy Kade"],
  ["a29.jpg", "Altitude", "North Arcade"],
  ["a1060.jpg", "Slow Coffee", "The Quiet Hours"],
  ["a1050.jpg", "Low Tide", "Sol & Shore"],
  ["a250.jpg", "Paper Planes", "Cass Rowe"],
  ["a1039.jpg", "Evergreen", "Juniper Vale"],
  ["a137.jpg", "Tunnel Vision", "Okun"],
];
const songs = [
  ["a110.jpg", "Low Sun", "Mara Lind", "3:41"],
  ["a65.jpg", "Hold the Light", "Ivy Kade", "3:12"],
  ["a1019.jpg", "Weather Systems", "North Arcade", "4:05"],
  ["a211.jpg", "Harbor Lights", "Theo Marsh", "2:58"],
  ["a64.jpg", "Daisy Chain", "Cass Rowe", "3:27"],
  ["a1044.jpg", "Riverbend", "Juniper Vale", "3:50"],
  ["a129.jpg", "Bench by the Sea", "The Quiet Hours", "4:18"],
  ["a225.jpg", "Green Tea", "Lumen", "2:44"],
];
const stations = [
  ["a177.jpg", "Trail Mix"],
  ["a55.jpg", "Calm"],
  ["a42.jpg", "Café"],
  ["a1043.jpg", "Outdoors"],
  ["a110.jpg", "Sunset"],
  ["a1069.jpg", "Deep Blue"],
];
const $ = (id) => document.getElementById(id);
const img = (src) => `<img src="img/${src}" alt="" loading="lazy">`;

$("picks").innerHTML = picks
  .map(([src, label, t, s, bg]) => `<button class="card pick" style="background:${bg}">${img(src)}<span class="label">${label}</span><div class="cap"><div class="t">${t}</div><div class="s">${s}</div></div></button>`)
  .join("");
const squares = (rows) =>
  rows.map(([src, t, s]) => `<button class="card">${img(src)}<div class="t">${t}</div><div class="s">${s}</div></button>`).join("");
$("recent").innerHTML = squares(recent);
$("charts").innerHTML = songs
  .map(([src, t, s, d], i) => `<button class="song"><span class="n">${i + 1}</span>${img(src)}<span><div class="t">${t}</div><div class="s">${s}</div></span><span class="d">${d}</span><span class="more"><i data-lucide="ellipsis"></i></span></button>`)
  .join("");
$("stations").innerHTML = stations
  .map(([src, t]) => `<button class="card station">${img(src)}<div class="t">${t}</div></button>`)
  .join("");

$("releases").innerHTML = squares([
  ["a1074.jpg", "Pride", "Okun"],
  ["a184.jpg", "Dune", "Sol & Shore"],
  ["a1050.jpg", "Coastline", "Lumen"],
  ["a152.jpg", "Petals", "Mara Lind"],
  ["a1039.jpg", "Canopy", "Juniper Vale"],
  ["a177.jpg", "Valley Floor", "North Arcade"],
]);

window.lucide?.createIcons();


// ---------- Liquid Glass ----------
let detach = [];
const lensOn = () => {
  detach = [...document.querySelectorAll("[data-lens]")].map((el) =>
    attachLiquidGlass(el, { radius: el.dataset.radius ? Number(el.dataset.radius) : undefined }),
  );
};
const lensOff = () => { detach.forEach((f) => f()); detach = []; };

// ---------- Segmented controls ----------
function segmented(root, onPick) {
  const thumb = root.querySelector(".thumb");
  const buttons = [...root.querySelectorAll("button")];
  const place = () => {
    const on = buttons.find((b) => b.getAttribute("aria-pressed") === "true");
    thumb.style.width = `${on.offsetWidth}px`;
    thumb.style.transform = `translateX(${on.offsetLeft - 2}px)`;
    thumb.style.left = "2px";
  };
  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      buttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      place();
      onPick(b);
    }),
  );
  place();
  return place;
}

const device = $("device");
const q = new URLSearchParams(location.search);
const setDevice = (kind) => { device.className = `device ${kind}`; };
const placeDevice = segmented($("device-seg"), (b) => setDevice(b.dataset.device));
const placeGlass = segmented($("glass-seg"), (b) => (b.dataset.glass === "lens" ? lensOn() : lensOff()));

// ?phone, ?light and ?frosted, for links and screenshots.
const pick = (seg, attr, val) => seg.querySelector(`[data-${attr}="${val}"]`)?.click();
if (q.has("phone")) pick($("device-seg"), "device", "phone");
if (q.has("light")) document.documentElement.classList.remove("dark");
if (q.has("frosted")) pick($("glass-seg"), "glass", "frosted");
else lensOn();

const theme = $("theme");
const syncTheme = () => {
  const dark = document.documentElement.classList.contains("dark");
  theme.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  theme.innerHTML = `<i data-lucide="${dark ? "sun" : "moon"}"></i>`;
  window.lucide?.createIcons();
};
theme.addEventListener("click", () => { document.documentElement.classList.toggle("dark"); syncTheme(); });
syncTheme();
document.fonts?.ready.then(() => { placeDevice(); placeGlass(); });

// ---------- App behaviour ----------
const tabbar = $("tabbar");
const lens = tabbar.querySelector(".liquid-lens");
const tabs = [...tabbar.querySelectorAll(".tab")];
const placeLens = () => {
  const on = tabs.find((t) => t.hasAttribute("aria-current")) ?? tabs[0];
  lens.style.width = `${on.offsetWidth}px`;
  lens.style.transform = `translateX(${on.offsetLeft - 4}px)`;
};
tabs.forEach((t) =>
  t.addEventListener("click", () => {
    tabs.forEach((x) => x.removeAttribute("aria-current"));
    t.setAttribute("aria-current", "page");
    placeLens();
  }),
);
new ResizeObserver(placeLens).observe(tabbar);

const side = [...document.querySelectorAll(".side-item")];
side.forEach((s) =>
  s.addEventListener("click", () => {
    side.forEach((x) => x.removeAttribute("aria-current"));
    s.setAttribute("aria-current", "page");
  }),
);

const play = $("play");
const bar = $("bar");
let playing = true;
let progress = 0.38;
play.addEventListener("click", () => {
  playing = !playing;
  play.setAttribute("aria-label", playing ? "Pause" : "Play");
  play.innerHTML = `<i data-lucide="${playing ? "pause" : "play"}"></i>`;
  window.lucide?.createIcons();
});
setInterval(() => {
  if (!playing) return;
  progress = (progress + 0.0045) % 1;
  bar.style.width = `${progress * 100}%`;
}, 1000);
