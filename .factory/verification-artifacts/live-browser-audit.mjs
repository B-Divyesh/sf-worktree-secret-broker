import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const origin = 'https://worktree-secret-broker.sociobot.in';
const browser = await chromium.launch({ headless: true });
const report = { routes: [], flow: {}, keyboard: {}, mobile: {}, reducedMotion: {}, serviceWorker: {} };

const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
for (const path of ['/', '/demo', '/privacy', '/terms', '/definitely-missing-verification-5']) {
  const consoleErrors = []; const pageErrors = []; const requestFailures = [];
  const onConsole = message => { if (message.type() === 'error') consoleErrors.push(message.text()); };
  const onPageError = error => pageErrors.push(error.message);
  const onRequestFailed = request => requestFailures.push({ url: request.url(), error: request.failure()?.errorText });
  page.on('console', onConsole); page.on('pageerror', onPageError); page.on('requestfailed', onRequestFailed);
  const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).analyze();
  const headings = await page.locator('h1,h2,h3,h4,h5,h6').evaluateAll(nodes => nodes.map(node => ({ level: Number(node.tagName.slice(1)), text: node.textContent.trim() })));
  const headingSkips = headings.filter((heading, index) => index > 0 && heading.level > headings[index - 1].level + 1);
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  const headers = await response.allHeaders();
  report.routes.push({ path, status: response.status(), title: await page.title(), lang: await page.locator('html').getAttribute('lang'), h1: await page.locator('h1').count(), main: await page.locator('main').count(), headings, headingSkips, imagesWithoutAlt, axeSeriousCritical: axe.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), axeAll: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), consoleErrors, pageErrors, requestFailures, headers });
  page.off('console', onConsole); page.off('pageerror', onPageError); page.off('requestfailed', onRequestFailed);
}

const flowRequests = []; const flowFailures = []; const flowConsole = []; const flowPageErrors = [];
page.on('request', request => flowRequests.push({ method: request.method(), url: request.url(), type: request.resourceType() }));
page.on('requestfailed', request => flowFailures.push({ url: request.url(), error: request.failure()?.errorText }));
page.on('console', message => { if (message.type() === 'error') flowConsole.push(message.text()); });
page.on('pageerror', error => flowPageErrors.push(error.message));
await page.goto(origin, { waitUntil: 'networkidle' });
await page.evaluate(() => { localStorage.setItem('real:sentinel', 'keep'); sessionStorage.setItem('real:sentinel', 'keep'); });
await page.getByRole('link', { name: 'Try it with sample data' }).click();
await page.getByRole('button', { name: 'Reset demo' }).click();
await page.getByRole('link', { name: 'Start for real' }).click();
await page.getByLabel('Approved variable names').fill('BAD-NAME');
await page.getByRole('button', { name: 'Generate team policy' }).click();
const invalidMessage = await page.locator('#policy-output').innerText();
await page.getByLabel('Approved variable names').fill('TOKEN TOKEN');
await page.getByRole('button', { name: 'Generate team policy' }).click();
const duplicateMessage = await page.locator('#policy-output').innerText();
await page.getByLabel('Approved variable names').fill('SERVICE_TOKEN');
await page.getByLabel('Provider').selectOption('op');
await page.getByLabel('Lease length').selectOption('60');
await page.getByRole('button', { name: 'Generate team policy' }).click();
const recoveredOutput = await page.locator('#policy-output').innerText();
await page.getByRole('button', { name: 'Copy install command' }).click();
const clipboard = await page.evaluate(() => navigator.clipboard.readText());
report.flow = {
  requests: flowRequests,
  requestOrigins: [...new Set(flowRequests.map(request => new URL(request.url).origin))],
  failures: flowFailures,
  consoleErrors: flowConsole,
  pageErrors: flowPageErrors,
  cookies: await context.cookies(),
  storage: await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })),
  invalidMessage, duplicateMessage, recoveredOutput, clipboard,
};

await page.goto(origin);
const focusOrder = [];
for (let i = 0; i < 24; i += 1) {
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    return { tag: element.tagName, text: (element.textContent || element.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' '), id: element.id, outlineWidth: style.outlineWidth, outlineStyle: style.outlineStyle, outlineColor: style.outlineColor };
  });
  focusOrder.push(focused);
  if (i === 0) await page.screenshot({ path: '.factory/verification-artifacts/live-focus-skip.png' });
}
await page.goto(origin);
await page.keyboard.press('Tab');
await page.keyboard.press('Enter');
await page.keyboard.press('Tab');
const afterSkip = await page.evaluate(() => ({ active: document.activeElement?.textContent?.trim(), scrollY }));
report.keyboard = { focusOrder, uniqueFocusTargets: [...new Set(focusOrder.map(item => `${item.tag}:${item.id}:${item.text}`))], afterSkip };

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mobilePage = await mobileContext.newPage();
await mobilePage.goto(origin, { waitUntil: 'networkidle' });
await mobilePage.screenshot({ path: '.factory/verification-artifacts/live-mobile-390.png', fullPage: false });
const mobileAction = await mobilePage.getByRole('link', { name: 'Try it with sample data' }).boundingBox();
const undersized = await mobilePage.locator('a:visible,button:visible,textarea:visible,select:visible').evaluateAll(elements => elements.map(element => { const rect = element.getBoundingClientRect(); return { tag: element.tagName, text: (element.textContent || element.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' '), width: rect.width, height: rect.height }; }).filter(item => item.width < 44 || item.height < 44));
const beforeResize = await mobilePage.evaluate(() => ({ innerWidth, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight }));
await mobilePage.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
const afterResize = await mobilePage.evaluate(() => ({ innerWidth, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight }));
report.mobile = { viewport: { width: 390, height: 844 }, action: mobileAction, actionInFirstScreen: mobileAction.y + mobileAction.height <= 844, undersized, beforeResize, afterText200Percent: afterResize };
await mobileContext.close();

const reducedContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const reducedPage = await reducedContext.newPage();
await reducedPage.goto(origin);
report.reducedMotion = await reducedPage.evaluate(() => ({ matches: matchMedia('(prefers-reduced-motion: reduce)').matches, animations: document.getAnimations().map(animation => ({ playState: animation.playState, duration: animation.effect?.getTiming().duration })), sampleDurations: [...document.querySelectorAll('a,button,.hero-art')].slice(0, 10).map(element => { const style = getComputedStyle(element); return { transitionDuration: style.transitionDuration, animationDuration: style.animationDuration, scrollBehavior: style.scrollBehavior }; }) }));
await reducedContext.close();

const swContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const swPage = await swContext.newPage();
await swPage.goto(`${origin}/demo`, { waitUntil: 'networkidle' });
await swPage.evaluate(() => navigator.serviceWorker.ready);
await swPage.reload({ waitUntil: 'networkidle' });
await swPage.waitForFunction(() => navigator.serviceWorker.controller !== null);
const updateState = await swPage.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration.update(); return { controlling: Boolean(navigator.serviceWorker.controller), waiting: Boolean(registration.waiting), activeScript: registration.active?.scriptURL, caches: await caches.keys() }; });
await swContext.setOffline(true);
await swPage.reload({ waitUntil: 'domcontentloaded' });
const offlineState = { title: await swPage.title(), heading: await swPage.locator('h1').innerText(), bannerVisible: await swPage.getByText('Demo — sample data, nothing is saved to your real data').first().isVisible() };
await swContext.setOffline(false);
report.serviceWorker = { updateState, offlineState };
await swContext.close();

console.log(JSON.stringify(report, null, 2));
await context.close();
await browser.close();
