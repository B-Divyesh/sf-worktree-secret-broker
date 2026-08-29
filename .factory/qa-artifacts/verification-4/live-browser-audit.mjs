import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

const base = 'https://worktree-secret-broker.sociobot.in';
const browser = await chromium.launch();
const report = { routes: {}, firstRead: {}, mobile: {}, keyboard: {}, reducedMotion: {}, privacyFlow: {}, serviceWorker: {} };

for (const path of ['/', '/demo', '/privacy', '/terms', '/missing']) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const requests = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on('request', request => requests.push(request.url()));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  const axe = await new AxeBuilder({ page }).analyze();
  report.routes[path] = {
    status: response?.status(),
    title: await page.title(),
    lang: await page.locator('html').getAttribute('lang'),
    h1Count: await page.locator('h1').count(),
    h1: await page.locator('h1').allInnerTexts(),
    mainCount: await page.locator('main').count(),
    missingAlts: await page.locator('img:not([alt])').count(),
    unlabeledButtons: await page.locator('button').evaluateAll(buttons => buttons.filter(button => !(button.textContent?.trim() || button.getAttribute('aria-label'))).length),
    requestOrigins: [...new Set(requests.map(url => new URL(url).origin))],
    requestUrls: requests,
    cookies: await context.cookies(),
    seriousCriticalAxe: axe.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? '')).map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.length })),
    consoleErrors,
    pageErrors,
    headers: await response?.allHeaders(),
  };
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.screenshot({ path: '.factory/qa-artifacts/verification-4/live-cold-desktop.png', fullPage: false });
  const action = page.getByRole('link', { name: 'Try it with sample data' });
  report.firstRead = {
    heading: await page.getByRole('heading', { level: 1 }).innerText(),
    audienceSentence: await page.locator('.hero-copy .lede').innerText(),
    primaryAction: await action.innerText(),
    actionVisible: await action.isVisible(),
    actionCompanion: await page.locator('.hero-action > span').innerText(),
    firstScreenFacts: await page.locator('.plain-facts li').allInnerTexts(),
  };
  await action.click();
  report.firstRead.afterOneClick = {
    url: page.url(),
    heading: await page.getByRole('heading', { level: 1 }).innerText(),
    banner: await page.locator('.demo-banner').innerText(),
    terminal: await page.locator('.terminal').innerText(),
  };
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.screenshot({ path: '.factory/qa-artifacts/verification-4/live-mobile-390.png', fullPage: true });
  report.mobile = await page.evaluate(() => {
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const targets = [...document.querySelectorAll('a, button, input, textarea, select')]
      .filter(visible)
      .map(element => {
        const rect = element.getBoundingClientRect();
        return { name: element.getAttribute('aria-label') || element.textContent?.trim() || element.getAttribute('name'), width: rect.width, height: rect.height };
      });
    const action = [...document.querySelectorAll('a')].find(element => element.textContent?.includes('Try it with sample data'));
    return {
      viewport: [innerWidth, innerHeight],
      scrollWidth: document.documentElement.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      primaryActionVisible: action ? visible(action) && action.getBoundingClientRect().top < innerHeight : false,
      undersizedTargets: targets.filter(target => target.width < 44 || target.height < 44),
      targetCount: targets.length,
    };
  });
  await context.close();
}

{
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  report.keyboard.firstTab = await page.evaluate(() => ({
    text: document.activeElement?.textContent?.trim(),
    href: document.activeElement?.getAttribute('href'),
    outline: getComputedStyle(document.activeElement).outline,
    outlineOffset: getComputedStyle(document.activeElement).outlineOffset,
  }));
  await page.keyboard.press('Enter');
  report.keyboard.afterSkip = await page.evaluate(() => ({ id: document.activeElement?.id, tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim() }));
  await page.keyboard.press('Tab');
  report.keyboard.afterSkipThenTab = await page.evaluate(() => ({ href: document.activeElement?.getAttribute('href'), text: document.activeElement?.textContent?.trim() }));
  await page.getByLabel('Approved variable names').focus();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('bad-name');
  await page.getByRole('button', { name: 'Generate team policy' }).focus();
  const focusStyle = await page.evaluate(() => ({ outline: getComputedStyle(document.activeElement).outline, outlineOffset: getComputedStyle(document.activeElement).outlineOffset }));
  await page.keyboard.press('Enter');
  const invalid = await page.locator('#policy-output').innerText();
  await page.getByLabel('Approved variable names').fill('SERVICE_TOKEN');
  await page.getByRole('button', { name: 'Generate team policy' }).press('Enter');
  report.keyboard.policy = { focusStyle, invalid, recoveredOutput: await page.locator('#policy-output').innerText() };
  await context.close();
}

{
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  report.reducedMotion = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')];
    const durations = all.flatMap(element => {
      const style = getComputedStyle(element);
      return [{ tag: element.tagName, animationDuration: style.animationDuration, transitionDuration: style.transitionDuration, scrollBehavior: style.scrollBehavior }];
    });
    return {
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      activeAnimations: document.getAnimations().filter(animation => animation.playState === 'running').length,
      nonTrivialDurations: durations.filter(item => !['0s', '0.001ms'].includes(item.animationDuration) || !['0s', '0.001ms'].includes(item.transitionDuration)),
      htmlScrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    };
  });
  await context.close();
}

{
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests = [];
  const failures = [];
  const errors = [];
  page.on('request', request => requests.push(request.url()));
  page.on('requestfailed', request => failures.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.getByLabel('Approved variable names').fill('SERVICE_TOKEN');
  await page.getByRole('button', { name: 'Generate team policy' }).click();
  report.privacyFlow = {
    origins: [...new Set(requests.map(url => new URL(url).origin))],
    requests,
    failures,
    errors,
    cookies: await context.cookies(),
    localStorage: await page.evaluate(() => ({ ...localStorage })),
    sessionStorage: await page.evaluate(() => ({ ...sessionStorage })),
  };
  await context.close();
}

{
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await context.newPage();
  await page.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const update = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update();
    return { scope: registration?.scope, hasActive: Boolean(registration?.active), hasWaiting: Boolean(registration?.waiting) };
  });
  await context.setOffline(true);
  await page.reload({ waitUntil: 'commit', timeout: 5000 });
  const offline = {
    url: page.url(),
    heading: await page.getByRole('heading', { level: 1 }).innerText(),
    bannerVisible: await page.locator('.demo-banner').isVisible(),
  };
  await context.setOffline(false);
  report.serviceWorker = { update, offline };
  await context.close();
}

await browser.close();
await writeFile('.factory/qa-artifacts/verification-4/live-browser-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  routeSummary: Object.fromEntries(Object.entries(report.routes).map(([path, value]) => [path, { status: value.status, axe: value.seriousCriticalAxe.length, console: value.consoleErrors.length, page: value.pageErrors.length, origins: value.requestOrigins }])),
  firstRead: report.firstRead,
  mobile: report.mobile,
  keyboard: report.keyboard,
  reducedMotion: report.reducedMotion,
  privacy: report.privacyFlow,
  serviceWorker: report.serviceWorker,
}, null, 2));
