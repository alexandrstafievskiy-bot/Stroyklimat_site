import { chromium } from "playwright";

const BASE = "http://localhost:8000";
const PAGES = [
  "/index.html",
  "/catalog.html",
  "/product.html?id=",
  "/cart.html",
  "/favorites.html",
  "/about.html",
  "/delivery.html",
  "/returns.html",
  "/contacts.html",
];

function pickAnyProductId(catalog) {
  const item = (catalog || []).find(p => p && p.id);
  return item ? item.id : "";
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on("pageerror", (err) => errors.push({ type: "pageerror", message: String(err) }));
  page.on("console", (msg) => {
    if (["error"].includes(msg.type())) errors.push({ type: "console", message: msg.text() });
  });

  // Load catalog.json to get a real product id
  const catalogRes = await page.request.get(`${BASE}/site_data/catalog.json`);
  if (!catalogRes.ok()) throw new Error("Cannot load site_data/catalog.json");
  const catalog = await catalogRes.json();
  const pid = pickAnyProductId(catalog);

  const resolved = PAGES.map(p => {
    if (p === "/product.html?id=") return `/product.html?id=${encodeURIComponent(pid)}`;
    return p;
  });

  for (const path of resolved) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);
    await page.screenshot({ path: `./tests_${path.replace(/[^\w]+/g, "_")}.png`, fullPage: true });

    // Try common interactions
    const addBtn = page.locator('[data-add], button:has-text("В кошик"), button:has-text("Купити")').first();
    if (await addBtn.count()) {
      await addBtn.click({ timeout: 2000 }).catch(()=>{});
      await page.waitForTimeout(150);
    }

    const favBtn = page.locator('[data-fav], button:has-text("♡"), button:has-text("♥")').first();
    if (await favBtn.count()) {
      await favBtn.click({ timeout: 2000 }).catch(()=>{});
      await page.waitForTimeout(150);
    }
  }

  // Print summary
  if (errors.length) {
    console.log("\n❌ ERRORS FOUND:");
    for (const e of errors) console.log("-", e.type, e.message);
    process.exitCode = 1;
  } else {
    console.log("\n✅ Smoke sweep OK (no console/page errors). Screenshots saved in current folder.");
  }

  await browser.close();
})();
