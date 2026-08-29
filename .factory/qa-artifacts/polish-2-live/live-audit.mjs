import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

const base = 'https://worktree-secret-broker.sociobot.in';
const browser = await chromium.launch();
const report = { routes: {}, firstScreen: {}, demo: {}, mobile: {}, focus: {}, reducedMotion: {}, offline: {} };

for (const path of ['/', '/demo', '/privacy', '/terms', '/missing']) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const requests = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on('request', request => requests.push(request.url()));
  page.on('console', message => {
    if (message.type() === 'error' && !(path === '/missing' && message.text().includes('404'))) consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).analyze();
  report.routes[path] = {
    status: response?.status(),
    title: await page.title(),
    description: await page.locator('meta[name="description"]').getAttribute('content'),
    canonical: await page.locator('link[rel="canonical"]').getAttribute('href'),
    ogTitle: await page.locator('meta[property="og:title"]').getAttribute('content'),
    twitterTitle: await page.locator('meta[name="twitter:title"]').getAttribute('content'),
    lang: await page.locator('html').getAttribute('lang'),
    h1Count: await page.locator('h1').count(),
    mainCount: await page.locator('main').count(),
    missingAlts: await page.locator('img:not([alt])').count(),
    seriousCriticalAxe: axe.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? '')).map(item => item.id),
    consoleErrors,
    pageErrors,
    requestOrigins: [...new Set(requests.map(url => new URL(url).origin))],
  };
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.screenshot({ path: '.factory/qa-artifacts/polish-2-live/cold-home-desktop.png', fullPage: false });
  const action = page.getByRole('link', { name: 'Try it with sample data' });
  report.firstScreen = {
    heading: await page.getByRole('heading', { level: 1 }).innerText(),
    audience: await page.locator('.hero-copy .lede').innerText(),
    actionVisible: await action.isVisible(),
    actionCompanion: await page.locator('.hero-action > span').innerText(),
    facts: await page.locator('.plain-facts li').allInnerTexts(),
    limitsLabel: await page.locator('.limits .eyebrow').innerText(),
  };
  await page.evaluate(() => {
    localStorage.setItem('real:local-sentinel', 'keep');
    sessionStorage.setItem('real:session-sentinel', 'keep');
  });
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await action.click();
  const directUrlAfterOneClick = page.url();
  await page.screenshot({ path: '.factory/qa-artifacts/polish-2-live/demo-after-one-click.png', fullPage: false });
  const entered = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  await page.getByRole('button', { name: 'Reset demo' }).click();
  const reset = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  await page.getByRole('link', { name: 'Start for real' }).click();
  const exited = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  await page.getByLabel('Approved variable names').fill('TOKEN TOKEN');
  await page.getByRole('button', { name: 'Generate team policy' }).click();
  report.demo = {
    directUrlAfterOneClick,
    entered,
    reset,
    exited,
    duplicateError: await page.locator('#policy-output').innerText(),
    helperInputs: await page.locator('#policy-desk input').count(),
    helperTextareas: await page.locator('#policy-desk textarea').count(),
    requestOrigins: [...new Set(requests.map(url => new URL(url).origin))],
  };
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.screenshot({ path: '.factory/qa-artifacts/polish-2-live/cold-home-mobile-390.png', fullPage: true });
  report.mobile = await page.evaluate(() => {
    const action = [...document.querySelectorAll('a')].find(element => element.textContent?.includes('Try it with sample data'));
    const targets = [...document.querySelectorAll('a,button,textarea,select')].filter(element => {
      const style = getComputedStyle(element); const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }).map(element => { const rect = element.getBoundingClientRect(); return { text: element.textContent?.trim(), width: rect.width, height: rect.height }; });
    return {
      viewport: [innerWidth, innerHeight],
      scrollWidth: document.documentElement.scrollWidth,
      actionBottom: action?.getBoundingClientRect().bottom,
      undersizedTargets: targets.filter(target => target.width < 44 || target.height < 44),
    };
  });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  report.mobile.afterText200Percent = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
    headingVisible: Boolean(document.querySelector('h1')?.getBoundingClientRect().height),
  }));
  await context.close();
}

{
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(base);
  await page.keyboard.press('Tab');
  const firstTab = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), outline: getComputedStyle(document.activeElement).outline }));
  await page.keyboard.press('Enter');
  const afterSkip = await page.evaluate(() => ({ id: document.activeElement?.id, tag: document.activeElement?.tagName }));
  await page.getByRole('link', { name: 'Demo' }).click();
  await page.waitForFunction(() => document.activeElement?.tagName === 'H1');
  const routeFocus = await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim() }));
  report.focus = { firstTab, afterSkip, routeFocus };
  await context.close();
}

{
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(base);
  report.reducedMotion = await page.locator('.hero-art img').evaluate(element => ({
    mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    animationDuration: getComputedStyle(element).animationDuration,
    animationIterationCount: getComputedStyle(element).animationIterationCount,
  }));
  await context.close();
}

{
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  await page.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'commit', timeout: 5000 });
  report.offline = {
    heading: await page.getByRole('heading', { level: 1 }).innerText(),
    bannerVisible: await page.locator('.demo-banner').isVisible(),
  };
  await context.setOffline(false);
  await context.close();
}

await browser.close();
await writeFile('.factory/qa-artifacts/polish-2-live/live-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
