import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

const origin = 'https://worktree-secret-broker.sociobot.in';
const browser = await chromium.launch({ headless: true });
const result = { routes: {}, requests: [], mobile: {}, keyboard: {}, motion: {}, offline: {}, license: {} };

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => result.requests.push(request.url()));

for (const path of ['/', '/demo', '/privacy', '/terms']) {
  const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).analyze();
  const serious = axe.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''));
  result.routes[path] = {
    status: response?.status(),
    title: await page.title(),
    h1: await page.locator('h1').count(),
    main: await page.locator('main').count(),
    seriousAxe: serious.length,
  };
  if (response?.status() !== 200 || serious.length) throw new Error(`route failed: ${path}`);
}

const missing = await page.goto(`${origin}/repair-6-missing`, { waitUntil: 'domcontentloaded' });
const missingAxe = await new AxeBuilder({ page }).analyze();
result.routes['/missing'] = {
  status: missing?.status(),
  title: await page.title(),
  h1: await page.locator('h1').count(),
  main: await page.locator('main').count(),
  seriousAxe: missingAxe.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? '')).length,
};
if (missing?.status() !== 404 || result.routes['/missing'].seriousAxe) throw new Error('404 route failed');

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(origin, { waitUntil: 'networkidle' });
await page.screenshot({ path: '.factory/qa-artifacts/repair-6/live-mobile-390.png', fullPage: true });
result.mobile = await page.evaluate(() => {
  const action = document.querySelector('.hero-action .button').getBoundingClientRect();
  const undersized = [...document.querySelectorAll('a,button,input,textarea,select')]
    .filter(element => {
      const style = getComputedStyle(element);
      return style.visibility !== 'hidden' && style.display !== 'none' && element.getClientRects().length > 0;
    })
    .map(element => ({ label: element.textContent?.trim() || element.getAttribute('aria-label') || element.getAttribute('name'), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))
    .filter(box => box.width < 44 || box.height < 44);
  return { innerWidth, scrollWidth: document.documentElement.scrollWidth, actionBottom: action.bottom, actionWidth: action.width, actionHeight: action.height, undersized };
});
if (result.mobile.scrollWidth !== 390 || result.mobile.actionBottom > 844 || result.mobile.undersized.length) throw new Error('mobile gate failed');

await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
result.mobile.zoomScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
if (result.mobile.zoomScrollWidth !== 390) throw new Error('200% text overflow');

const keyboardPage = await context.newPage();
await keyboardPage.goto(origin);
await keyboardPage.keyboard.press('Tab');
result.keyboard.first = await keyboardPage.evaluate(() => document.activeElement?.textContent?.trim());
await keyboardPage.keyboard.press('Enter');
result.keyboard.afterEnter = await keyboardPage.evaluate(() => document.activeElement?.tagName.toLowerCase());
if (result.keyboard.first !== 'Skip to main content' || result.keyboard.afterEnter !== 'main') throw new Error('keyboard gate failed');
await keyboardPage.close();

const reduced = await browser.newContext({ reducedMotion: 'reduce' });
const reducedPage = await reduced.newPage();
await reducedPage.goto(origin);
result.motion = await reducedPage.locator('.hero-art img').evaluate(element => ({ duration: getComputedStyle(element).animationDuration, iterations: getComputedStyle(element).animationIterationCount }));
if (result.motion.iterations !== '1') throw new Error('reduced-motion gate failed');
await reduced.close();

await page.goto(`${origin}/demo`);
await page.evaluate(async () => { const registration = await navigator.serviceWorker.ready; await registration.update(); });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
const session = await context.newCDPSession(page);
await session.send('Network.enable');
await session.send('Network.setCacheDisabled', { cacheDisabled: true });
await context.setOffline(true);
await page.reload({ waitUntil: 'commit', timeout: 10_000 });
result.offline = {
  controlled: await page.evaluate(() => navigator.serviceWorker.controller !== null),
  heading: await page.locator('h1').innerText(),
  banner: await page.locator('.demo-banner').innerText(),
};
await context.setOffline(false);
if (!result.offline.controlled || !result.offline.banner.includes('nothing is saved')) throw new Error('offline gate failed');

const sameOriginRequests = result.requests.filter(url => new URL(url).origin !== origin);
result.sameOriginOnly = sameOriginRequests.length === 0;
result.cookies = (await context.cookies()).map(cookie => ({ name: cookie.name, domain: cookie.domain }));
if (!result.sameOriginOnly || result.cookies.length) throw new Error('privacy gate failed');
await context.close();

const licenseContext = await browser.newContext();
const licensePage = await licenseContext.newPage();
const licenseErrors = [];
licensePage.on('console', message => { if (message.type() === 'error') licenseErrors.push(message.text()); });
const verifyResponses = [];
licensePage.on('response', response => { if (response.url().includes('/verify?license=')) verifyResponses.push(response.status()); });
await licensePage.goto(`${origin}/?license=repair_6_invalid_probe`, { waitUntil: 'networkidle' });
result.license = {
  urlStripped: !new URL(licensePage.url()).searchParams.has('license'),
  stored: await licensePage.evaluate(() => localStorage.getItem('sb_license:worktree-secret-broker') === 'repair_6_invalid_probe'),
  status: await licensePage.getByRole('status').innerText(),
  toolsHidden: await licensePage.locator('#team-tools').isHidden(),
  verifyResponses,
  errors: licenseErrors,
};
if (!result.license.urlStripped || !result.license.stored || !result.license.toolsHidden || !verifyResponses.includes(200) || licenseErrors.length) throw new Error('live license gate failed');
await licenseContext.close();

result.errors = errors.filter(error => !error.includes('404'));
if (result.errors.length) throw new Error(`console errors: ${result.errors.join('; ')}`);
await browser.close();
await writeFile('.factory/qa-artifacts/repair-6/live-browser-audit.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
