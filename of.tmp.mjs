import { chromium } from "@playwright/test";
const apiLogin = await fetch("http://localhost:4001/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "martin.amaro", password: "123456" }) });
const auth = await apiLogin.json();
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
await page.addInitScript((a) => localStorage.setItem("ptnv_auth_v1", JSON.stringify({ token: a.token, refreshToken: a.refreshToken, user: a.user, loading: false, error: null })), auth);
await page.goto("http://localhost:5006/#/tickets", { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const bubble = await page.getByText("¿Un ticket nuevo?").count();
await page.screenshot({ path: "/tmp/rhshots/tickets_offer.png", animations: "disabled" });
// abrir el formulario desde el globo
if (bubble) {
  await page.getByRole("button", { name: "Crear ticket aquí" }).click();
  await page.waitForTimeout(1500);
  // responder el primer paso para probar el auto-scroll
  await page.getByRole("button", { name: /Audio/ }).first().click();
  await page.waitForTimeout(900);
  const scroll = await page.evaluate(() => {
    const el = document.querySelector("[role='dialog'] .overflow-y-auto");
    return el ? { top: el.scrollTop, h: el.scrollHeight, c: el.clientHeight } : null;
  });
  await page.screenshot({ path: "/tmp/rhshots/tickets_offer_form.png", animations: "disabled" });
  console.log(JSON.stringify({ bubble, scroll, errors }));
} else {
  console.log(JSON.stringify({ bubble, errors }));
}
await browser.close();
