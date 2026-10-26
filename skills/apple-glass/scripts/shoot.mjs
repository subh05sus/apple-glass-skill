#!/usr/bin/env node
/**
 * apple-glass: screenshots (and an optional design audit) of a running app,
 * in each theme, viewport and surface style.
 *
 *   node shoot.mjs --base http://localhost:3000 --out shots [options] /path /other/path
 *
 * Options
 *   --themes dark,light            themes to shoot (default: dark)
 *   --viewports phone,desktop      390x844 touch / 1440x900 (default: both)
 *   --surfaces on,frosted,off      surface styles via --glass-key (default: none set)
 *   --theme-key theme              localStorage key the app reads its theme from
 *                                  (next-themes: "theme"; SparkMentor: "sparkmentor:theme")
 *   --glass-key sparkmentor:glass  localStorage key for the surface style
 *   --set-storage key=value        extra localStorage entries (repeatable)
 *   --reduced-motion               emulate prefers-reduced-motion: reduce
 *   --contrast more                emulate prefers-contrast
 *   --reduced-transparency         emulate prefers-reduced-transparency: reduce
 *   --wait 1200                    ms to settle after load
 *   --full-page                    capture the whole scroll height
 *   --audit                        write audit.json + audit.md (spacing, targets, text,
 *                                  contrast, glass layering, sideways scroll)
 *   --login /login                 sign in first, with SHOOT_USER / SHOOT_PASSWORD
 *   --user-field "#email"  --pass-field "#password"  --submit 'button[type="submit"]'
 *   --allow-remote                 permit a host other than localhost / *.localhost / *.test
 *
 * Needs puppeteer-core (`npm i -D puppeteer-core`, or PUPPETEER_CORE=<path to the package>)
 * and a local Chrome (CHROME_PATH, or the usual install locations).
 *
 * Use it on a local dev server or a test host with test accounts. It never
 * prints credentials; it refuses other hosts unless --allow-remote is given.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

// ---------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
const opts = { paths: [], setStorage: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => argv[++i];
  switch (a) {
    case "--base": opts.base = next(); break;
    case "--out": opts.out = next(); break;
    case "--themes": opts.themes = next(); break;
    case "--viewports": opts.viewports = next(); break;
    case "--surfaces": opts.surfaces = next(); break;
    case "--theme-key": opts.themeKey = next(); break;
    case "--glass-key": opts.glassKey = next(); break;
    case "--set-storage": opts.setStorage.push(next()); break;
    case "--reduced-motion": opts.reducedMotion = true; break;
    case "--contrast": opts.contrast = next(); break;
    case "--reduced-transparency": opts.reducedTransparency = true; break;
    case "--wait": opts.wait = Number(next()); break;
    case "--full-page": opts.fullPage = true; break;
    case "--audit": opts.audit = true; break;
    case "--login": opts.login = next(); break;
    case "--user-field": opts.userField = next(); break;
    case "--pass-field": opts.passField = next(); break;
    case "--submit": opts.submit = next(); break;
    case "--allow-remote": opts.allowRemote = true; break;
    case "-h": case "--help":
      console.log(fs.readFileSync(new URL(import.meta.url), "utf8").split("*/")[0]);
      process.exit(0);
    default:
      if (a.startsWith("--")) { console.error(`Unknown option ${a}`); process.exit(2); }
      opts.paths.push(a);
  }
}
if (!opts.base || !opts.out || opts.paths.length === 0) {
  console.error("usage: node shoot.mjs --base <url> --out <dir> [options] <path> [<path> ...]  (--help)");
  process.exit(2);
}
const BASE = opts.base.replace(/\/+$/, "");
const THEMES = (opts.themes ?? "dark").split(",").filter(Boolean);
const VIEWPORTS = (opts.viewports ?? "phone,desktop").split(",").filter(Boolean);
const SURFACES = opts.surfaces ? opts.surfaces.split(",").filter(Boolean) : [null];
const THEME_KEY = opts.themeKey ?? "theme";
const WAIT = Number.isFinite(opts.wait) ? opts.wait : 1200;
const SIZES = {
  phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};
for (const v of VIEWPORTS) if (!SIZES[v]) { console.error(`Unknown viewport ${v} (phone, desktop)`); process.exit(2); }
if (SURFACES[0] !== null && !opts.glassKey) { console.error("--surfaces needs --glass-key"); process.exit(2); }

const host = new URL(BASE).hostname;
const local = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(host) || host.endsWith(".localhost") || host.endsWith(".test");
if (!local && !opts.allowRemote) {
  console.error(`${host} is not a local or .test host. Use a local dev server, or pass --allow-remote for a test host you own.`);
  process.exit(2);
}

// ---------------------------------------------------------------- browser
async function loadPuppeteer() {
  try {
    return (await import("puppeteer-core")).default;
  } catch {
    if (process.env.PUPPETEER_CORE) {
      const req = createRequire(path.join(process.env.PUPPETEER_CORE, "package.json"));
      return req(process.env.PUPPETEER_CORE);
    }
    console.error("puppeteer-core not found: `npm i -D puppeteer-core`, or set PUPPETEER_CORE to its folder.");
    process.exit(2);
  }
}

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = {
    win32: [
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
      "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    ],
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ],
    linux: ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"],
  }[process.platform] ?? [];
  const found = candidates.find((p) => p && fs.existsSync(p));
  if (!found) { console.error("Chrome not found: set CHROME_PATH."); process.exit(2); }
  return found;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (p) => (p.replace(/^\/+|\/+$/g, "").replace(/[^a-zA-Z0-9]+/g, "_") || "home");

// ---------------------------------------------------------------- audit (runs in the page)
function auditPage({ phone }) {
  const MAX = 5000;
  const px = (v) => (typeof v === "string" && v.endsWith("px") ? parseFloat(v) : 0);
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return false; // also sr-only boxes
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none" && parseFloat(s.opacity) > 0.05;
  };
  const describe = (el) => {
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
    const text = (el.innerText || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${cls ? `.${cls}` : ""}${text ? ` "${text}"` : ""}`;
  };
  // Any CSS colour (rgb, oklch, color(), color-mix results) to sRGB bytes,
  // through a 1px canvas; getComputedStyle keeps oklch as oklch.
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const colours = new Map();
  const parse = (c) => {
    if (!c || !ctx) return null;
    if (colours.has(c)) return colours.get(c);
    let out = null;
    if (c === "transparent" || c === "rgba(0, 0, 0, 0)") out = { r: 0, g: 0, b: 0, a: 0 };
    else if (CSS.supports("color", c)) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      out = { r, g, b, a: a / 255 };
    }
    colours.set(c, out);
    return out;
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const over = (top, base) => ({
    r: top.r * top.a + base.r * (1 - top.a),
    g: top.g * top.a + base.g * (1 - top.a),
    b: top.b * top.a + base.b * (1 - top.a),
    a: 1,
  });
  // The colour behind an element: translucent layers composited over the
  // first opaque ancestor. Null when an image, gradient or backdrop blur is
  // in the way (glass): contrast there can't be known from styles alone.
  const backgroundOf = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage !== "none" || (s.backdropFilter && s.backdropFilter !== "none")) return null;
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 0.99) break;
      }
    }
    let base = layers.length && layers[layers.length - 1].a >= 0.99 ? layers.pop() : parse(getComputedStyle(document.documentElement).backgroundColor);
    if (!base || base.a < 0.99) base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
  };

  const all = [...document.body.querySelectorAll("*")].filter((el) => !el.closest("svg") || el.tagName === "svg").slice(0, MAX).filter(visible);
  const result = {
    elements: all.length,
    offGrid: {},
    smallTargets: [],
    tinyText: [],
    lowContrast: [],
    glassOnGlass: [],
    glassInContent: [],
    repeatedGlass: [],
    overflowX: [],
    fontSizes: {},
  };

  // 1. Spacing off the 2/4 px grid (leads: auto-centring margins are skipped).
  const SPACING = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginBottom", "rowGap", "columnGap"];
  for (const el of all) {
    const s = getComputedStyle(el);
    for (const p of SPACING) {
      const v = Math.round(px(s[p]) * 2) / 2;
      if (v <= 2 || v % 2 === 0) continue;
      const key = `${v}px`;
      const bucket = (result.offGrid[key] ??= { count: 0, samples: [] });
      bucket.count += 1;
      if (bucket.samples.length < 4) bucket.samples.push(`${describe(el)} (${p})`);
    }
    const ml = px(s.marginLeft), mr = px(s.marginRight);
    if (!(ml > 8 && Math.abs(ml - mr) < 1)) {
      for (const [p, raw] of [["marginLeft", ml], ["marginRight", mr]]) {
        const v = Math.round(raw * 2) / 2;
        if (v <= 2 || v % 2 === 0) continue;
        const bucket = (result.offGrid[`${v}px`] ??= { count: 0, samples: [] });
        bucket.count += 1;
        if (bucket.samples.length < 4) bucket.samples.push(`${describe(el)} (${p})`);
      }
    }
  }

  // 2. Tap targets, counting an ::after hit area (the kit's pointer-coarse trick).
  const MIN = phone ? 44 : 24;
  const INTERACTIVE = 'a[href],button,[role="button"],[role="tab"],[role="switch"],[role="checkbox"],[role="radio"],[role="menuitem"],[role="option"],input:not([type="hidden"]),select,textarea,summary';
  for (const el of document.querySelectorAll(INTERACTIVE)) {
    if (!visible(el) || el.matches(":disabled,[aria-disabled='true']")) continue;
    const s = getComputedStyle(el);
    // Inline links in running text are exempt (WCAG 2.5.8).
    if (el.tagName === "A" && s.display === "inline" && el.parentElement && /^(P|LI|SPAN|TD|LABEL)$/.test(el.parentElement.tagName)) continue;
    const r = el.getBoundingClientRect();
    let w = r.width, h = r.height;
    const a = getComputedStyle(el, "::after");
    if (a.content !== "none" && a.position === "absolute") {
      const grow = (v) => Math.max(0, -px(v));
      w = Math.max(w, r.width + grow(a.left) + grow(a.right), px(a.width));
      h = Math.max(h, r.height + grow(a.top) + grow(a.bottom), px(a.height));
    }
    if (w < MIN || h < MIN) {
      result.smallTargets.push({ el: describe(el), size: `${Math.round(r.width)}×${Math.round(r.height)}`, hit: `${Math.round(w)}×${Math.round(h)}` });
    }
  }

  // 3-4. Text: sizes in use, too small, too little contrast.
  const MIN_TEXT = phone ? 11 : 10;
  for (const el of all) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const s = getComputedStyle(el);
    const fs = px(s.fontSize);
    const key = `${Math.round(fs * 2) / 2}`;
    result.fontSizes[key] = (result.fontSizes[key] ?? 0) + 1;
    if (fs > 0 && fs < MIN_TEXT) result.tinyText.push({ el: describe(el), size: `${fs}px` });
    if (el.closest(":disabled,[aria-disabled='true'],[aria-hidden='true']")) continue;
    const fill = s.webkitTextFillColor && s.webkitTextFillColor !== s.color ? parse(s.webkitTextFillColor) : null;
    const fg = parse(s.color);
    if (!fg || fg.a < 0.1 || (fill && fill.a < 0.1)) continue;
    const bg = backgroundOf(el);
    if (!bg) continue;
    const text = over(fg, bg);
    const l1 = lum(text), l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const need = fs >= 18 || Number(s.fontWeight) >= 700 ? 3 : 4.5;
    if (ratio < need) result.lowContrast.push({ el: describe(el), ratio: Math.round(ratio * 100) / 100, need, size: `${fs}px` });
  }
  result.lowContrast.sort((a, b) => a.ratio - b.ratio);

  // 5. Glass layering.
  const glass = [...document.querySelectorAll(".liquid-glass")].filter(visible);
  const vw = document.documentElement.clientWidth;
  const viewportArea = vw * document.documentElement.clientHeight;
  const floats = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === "fixed" || p === "sticky") return true;
    }
    return false;
  };
  const parents = new Map();
  for (const g of glass) {
    if (g.parentElement?.closest(".liquid-glass")) result.glassOnGlass.push(describe(g));
    const r = g.getBoundingClientRect();
    if (!floats(g) && (r.width * r.height) / viewportArea > 0.12) result.glassInContent.push(`${describe(g)} (${Math.round(r.width)}×${Math.round(r.height)}, scrolls with content)`);
    const parent = g.parentElement;
    if (parent) parents.set(parent, (parents.get(parent) ?? 0) + 1);
  }
  for (const [parent, count] of parents) if (count >= 4) result.repeatedGlass.push(`${count} glass panes inside ${describe(parent)}`);

  // 6. Sideways scroll and what causes it.
  // The layout viewport, not innerWidth: phone emulation zooms out to fit
  // overflowing content, which would hide the very problem.
  if (document.documentElement.scrollWidth > vw + 1) {
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width < vw * 3) result.overflowX.push(`${describe(el)} (right edge ${Math.round(r.right)}px)`);
      if (result.overflowX.length >= 6) break;
    }
    if (!result.overflowX.length) result.overflowX.push(`page is ${document.documentElement.scrollWidth}px wide`);
  }

  result.smallTargets = result.smallTargets.slice(0, 25);
  result.tinyText = result.tinyText.slice(0, 15);
  result.lowContrast = result.lowContrast.slice(0, 20);
  return result;
}

function auditMarkdown(entries) {
  const lines = ["# Design audit (leads, not verdicts: look at the screenshots)", ""];
  for (const e of entries) {
    const a = e.audit;
    const sizes = Object.keys(a.fontSizes).map(Number).sort((x, y) => x - y);
    lines.push(`## ${e.path} · ${e.viewport} · ${e.theme}`, "");
    lines.push(`- Elements checked: ${a.elements}; text sizes in use (${sizes.length}): ${sizes.join(", ")}${sizes.length > 7 ? " (more than 7: tighten the type scale)" : ""}`);
    const off = Object.entries(a.offGrid).sort((x, y) => y[1].count - x[1].count);
    lines.push(`- Off-grid spacing: ${off.length ? off.map(([v, b]) => `${v} ×${b.count}`).join(", ") : "none"}`);
    for (const [v, b] of off.slice(0, 4)) lines.push(`  - ${v}: ${b.samples.join("; ")}`);
    lines.push(`- Small targets (< ${e.viewport === "phone" ? 44 : 24}px): ${a.smallTargets.length || "none"}`);
    for (const t of a.smallTargets.slice(0, 10)) lines.push(`  - ${t.el}: ${t.size}, hit area ${t.hit}`);
    lines.push(`- Text below the minimum: ${a.tinyText.length || "none"}`);
    for (const t of a.tinyText.slice(0, 6)) lines.push(`  - ${t.el}: ${t.size}`);
    lines.push(`- Low contrast: ${a.lowContrast.length || "none"}`);
    for (const t of a.lowContrast.slice(0, 10)) lines.push(`  - ${t.el}: ${t.ratio}:1 (needs ${t.need}:1 at ${t.size})`);
    if (a.glassOnGlass.length) lines.push(`- Glass on glass: ${a.glassOnGlass.join("; ")}`);
    if (a.glassInContent.length) lines.push(`- Glass in the content layer: ${a.glassInContent.join("; ")}`);
    if (a.repeatedGlass.length) lines.push(`- Repeated glass (content items made of glass?): ${a.repeatedGlass.join("; ")}`);
    if (a.overflowX.length) lines.push(`- Sideways scroll: ${a.overflowX.join("; ")}`);
    lines.push("");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------- run
const puppeteer = await loadPuppeteer();
fs.mkdirSync(opts.out, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "apple-glass-shoot-"));
const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  userDataDir: profile,
  args: ["--no-first-run", "--no-default-browser-check", "--disable-extensions", "--hide-scrollbars"],
});
const errors = new Set();
const audits = [];
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(90_000);
  page.on("pageerror", (e) => errors.add(`pageerror: ${String(e.message).slice(0, 200)}`));
  page.on("console", (m) => { if (m.type() === "error") errors.add(`console: ${m.text().slice(0, 200)}`); });
  const cdp = page.createCDPSession ? await page.createCDPSession() : await page.target().createCDPSession();

  const emulate = async (theme) => {
    const features = [
      { name: "prefers-color-scheme", value: theme },
      { name: "prefers-reduced-motion", value: opts.reducedMotion ? "reduce" : "no-preference" },
    ];
    if (opts.contrast) features.push({ name: "prefers-contrast", value: opts.contrast });
    if (opts.reducedTransparency) features.push({ name: "prefers-reduced-transparency", value: "reduce" });
    await cdp.send("Emulation.setEmulatedMedia", { media: "", features });
  };

  await page.setViewport(SIZES.desktop);
  await page.goto(`${BASE}${opts.login ?? opts.paths[0]}`, { waitUntil: "networkidle2" });

  if (opts.login) {
    const user = process.env.SHOOT_USER;
    const pass = process.env.SHOOT_PASSWORD;
    if (!user || !pass) throw new Error("--login needs SHOOT_USER and SHOOT_PASSWORD in the environment.");
    const userField = opts.userField ?? 'input[type="email"], input[name="email"], #email';
    const passField = opts.passField ?? 'input[type="password"]';
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await page.goto(`${BASE}${opts.login}`, { waitUntil: "networkidle2" });
      await sleep(3000); // typing before hydration is lost
      await page.click(userField, { clickCount: 3 });
      await page.type(userField, user);
      await page.click(passField, { clickCount: 3 });
      await page.type(passField, pass);
      await page.click(opts.submit ?? 'button[type="submit"]');
      for (let i = 0; i < 60 && new URL(page.url()).pathname.startsWith(opts.login); i++) await sleep(1000);
      if (!new URL(page.url()).pathname.startsWith(opts.login)) break;
    }
    if (new URL(page.url()).pathname.startsWith(opts.login)) throw new Error("Sign-in did not leave the login page.");
    console.log(`signed in, now at ${new URL(page.url()).pathname}`);
  }

  const extra = opts.setStorage.map((kv) => { const i = kv.indexOf("="); return [kv.slice(0, i), kv.slice(i + 1)]; });
  for (const vp of VIEWPORTS) {
    await page.setViewport(SIZES[vp]);
    for (const theme of THEMES) {
      await emulate(theme);
      for (const surface of SURFACES) {
        await page.evaluate(
          (entries) => { for (const [k, v] of entries) { try { localStorage.setItem(k, v); } catch {} } },
          [[THEME_KEY, theme], ...(surface ? [[opts.glassKey, surface]] : []), ...extra],
        );
        for (const p of opts.paths) {
          const name = `${slug(p)}-${theme}-${vp}${surface ? `-${surface}` : ""}.png`;
          try {
            await page.goto(`${BASE}${p}`, { waitUntil: "networkidle2" });
            await sleep(WAIT);
            await page.screenshot({ path: path.join(opts.out, name), fullPage: !!opts.fullPage });
            console.log(`shot ${name}`);
            if (opts.audit && surface === SURFACES[0]) {
              audits.push({ path: p, viewport: vp, theme, audit: await page.evaluate(auditPage, { phone: vp === "phone" }) });
            }
          } catch (e) {
            console.log(`FAILED ${name}: ${String(e.message).split("\n")[0]}`);
          }
        }
      }
    }
  }
  if (opts.audit) {
    fs.writeFileSync(path.join(opts.out, "audit.json"), JSON.stringify(audits, null, 2));
    fs.writeFileSync(path.join(opts.out, "audit.md"), auditMarkdown(audits));
    console.log(`audit: ${path.join(opts.out, "audit.md")}`);
  }
  if (errors.size) console.log(`page errors (${errors.size}):\n  ${[...errors].slice(0, 15).join("\n  ")}`);
} catch (e) {
  console.error(String(e?.message ?? e));
  process.exitCode = 1;
} finally {
  await browser.close();
  fs.rmSync(profile, { recursive: true, force: true });
}
