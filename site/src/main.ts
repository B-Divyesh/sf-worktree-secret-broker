import './style.css';

const PRODUCT = 'worktree-secret-broker';
const API = 'https://api.sociobot.in/api/v1';
const LICENSE_KEY = `sb_license:${PRODUCT}`;
const VERDICT_KEY = `sb_license_verdict:${PRODUCT}`;
const DAY = 86_400_000;

type Route = '/' | '/demo' | '/privacy' | '/terms' | '/not-found';

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[char] ?? char));

function routeFor(path: string): Route {
  if (path === '/' || path === '/demo' || path === '/privacy' || path === '/terms') return path;
  return '/not-found';
}

function shell(content: string, demo = false): string {
  return `
    ${demo ? `<aside class="demo-banner" aria-label="Demo mode"><span>Demo — sample data, nothing is saved</span><span class="demo-actions"><button type="button" data-reset-demo>Reset demo</button><a href="/" data-link>Start for real</a></span></aside>` : ''}
    <header class="site-header">
      <a class="wordmark" href="/" data-link aria-label="Worktree Secret Broker home"><span class="key-mark" aria-hidden="true"></span><span>Worktree<br>Secret Broker</span></a>
      <nav aria-label="Main navigation"><a href="/demo" data-link>Demo</a><a href="/#install">Install</a><a href="/privacy" data-link>Privacy</a></nav>
    </header>
    <main id="main">${content}</main>
    <footer>
      <p>Temporary secret leases for worktree processes.</p>
      <nav aria-label="Footer navigation"><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a><a href="https://www.sociobot.in/" rel="external">Built by Param Factory <span class="sr-only">(external site)</span></a></nav>
      <p>Version 0.1.0 · build 2026.08.28</p>
    </footer>`;
}

const terminal = (live = false) => `
  <section class="terminal-wrap" aria-labelledby="terminal-title">
    <div class="terminal-bar"><span class="lamp"></span><span id="terminal-title">wsb demo · isolated sample</span><span>00:00:01</span></div>
    <pre class="terminal" tabindex="0" aria-label="Recorded output from the real wsb demo command"><code><span class="prompt">$</span> wsb demo
<span class="brass">Demo — sample data, nothing is saved</span>
Temporary worktree: /tmp/wsb-demo-4821
Approved: DATABASE_URL, NPM_TOKEN
Lease: 15 minutes → sample check
<span class="green">✓ child received 2 approved variable names</span>
Receipt demo-1787913600
  worktree: /tmp/wsb-demo-4821
  names: DATABASE_URL, NPM_TOKEN
  started: 1787913600
  expires: 1787914500
  outcome: demo-complete
  revoked: 1787913601
<span class="muted">Temporary worktree removed.</span></code></pre>
    ${live ? '<p class="terminal-note">This recording matches <code>wsb demo</code>. The CLI creates and removes its own temporary directory.</p>' : ''}
  </section>`;

function home(): string {
  return shell(`
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Local CLI · v0.1.0</p>
        <h1 tabindex="-1">Lease secrets to one worktree process</h1>
        <p class="lede">For developers running coding agents, each worktree gets only approved development variables.</p>
        <div class="hero-action"><a class="button" href="/demo" data-link>Try it with sample data</a><span>Opens an isolated recorded CLI run.</span></div>
        <ul class="plain-facts"><li>Values stay in your keychain.</li><li>No secret files.</li><li>Free CLI. Team policy tools cost $19 once.</li></ul>
      </div>
      <figure class="hero-art"><img src="/key-orchard.webp" width="1200" height="800" alt="Three brass keys descend toward one lit worktree while distant keyholes stay dark." fetchpriority="high"><figcaption>Only named keys reach the temporary root chamber.</figcaption></figure>
    </section>
    <section class="product-preview" aria-labelledby="preview-heading">
      <div class="section-intro"><p class="eyebrow">See the boundary</p><h2 id="preview-heading">The receipt shows names, never values</h2><p>The real CLI run uses the same sample shown here.</p></div>
      ${terminal()}
    </section>
    <section class="steps" id="install" aria-labelledby="steps-heading">
      <p class="eyebrow">How it works</p><h2 id="steps-heading">Approve, run, revoke</h2>
      <ol>
        <li><span>01</span><div><h3>Map approved names</h3><p>Point each variable name at Keychain, Secret Service, or 1Password.</p><code>DATABASE_URL → keychain://my-app/database-url</code></div></li>
        <li><span>02</span><div><h3>Name the worktree</h3><p>The broker checks the Git root before starting one child process.</p><code>wsb run --worktree ../agent-42 -- npm test</code></div></li>
        <li><span>03</span><div><h3>Read the receipt</h3><p>Expiry stops the child. The receipt lists names, timing, and outcome.</p><code>outcome: child-exited · names: NPM_TOKEN</code></div></li>
      </ol>
      <div class="install-line"><code>cargo install --path .</code><button type="button" data-copy="cargo install --path .">Copy install command</button></div>
    </section>
    <section class="limits" aria-labelledby="limits-heading">
      <div><p class="eyebrow">A narrow tool</p><h2 id="limits-heading">What the broker does not do</h2></div>
      <ul><li>It does not host a vault.</li><li>It does not scan repositories.</li><li>It denies production-labelled entries by default.</li><li>It cannot hide variables from the child that needs them.</li></ul>
    </section>
    ${paidSection()}
  `);
}

function paidSection(): string {
  return `<section class="paid" aria-labelledby="paid-heading">
    <div><p class="eyebrow">Optional team tools</p><h2 id="paid-heading">Set one policy for every worktree</h2><p>The free CLI includes every runtime safety feature. Pay once for policy templates, review notes, and config generation.</p></div>
    <div class="price"><strong>$19</strong><span>one-time purchase</span><a class="button secondary" href="${API}/products/${PRODUCT}/checkout">Buy team policy tools <span class="sr-only">from Sociobot checkout</span></a></div>
    <form id="license-form" class="license-form"><label for="license">Have a license? Paste it</label><div><input id="license" name="license" autocomplete="off" spellcheck="false"><button type="submit">Verify license</button></div><p id="license-status" role="status">Sociobot is the merchant of record. Refunds are handled there.</p></form>
    <form id="policy-desk" class="policy-desk" hidden>
      <h3>Team policy generator</h3><p>Enter variable names only. The generator creates references and a review note in this browser.</p>
      <div class="policy-fields"><label for="policy-names">Approved variable names <textarea id="policy-names" rows="3">DATABASE_URL\nNPM_TOKEN</textarea></label><label for="policy-provider">Provider <select id="policy-provider"><option value="keychain">OS keychain</option><option value="op">1Password</option></select></label><label for="policy-ttl">Lease length <select id="policy-ttl"><option value="5">5 minutes</option><option value="15" selected>15 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option></select></label></div>
      <button type="submit">Generate team policy</button><pre id="policy-output" tabindex="0" aria-live="polite"><code>Your names-only config will appear here.</code></pre>
    </form>
  </section>`;
}

function demo(): string {
  return shell(`
    <section class="demo-page">
      <p class="eyebrow">One-click sandbox</p><h1 tabindex="-1">Watch a secret lease finish cleanly</h1>
      <p class="lede">This recording uses bundled sample names and an isolated temporary Git worktree.</p>
      ${terminal(true)}
      <div class="demo-grid"><section><h2>Sample input</h2><pre><code>DATABASE_URL
NPM_TOKEN
lease_minutes = 15</code></pre></section><section><h2>Observable result</h2><p>Two approved names reach the child. The temporary directory is removed after the receipt.</p></section></div>
      <div class="next-action"><a class="button" href="/#install">Install the real CLI</a><span>Then map your own keychain references.</span></div>
    </section>`, true);
}

function privacy(): string {
  return legal('Privacy — Worktree Secret Broker', 'Privacy stays local', `
    <p>The CLI sends no analytics, secrets, config, or receipts anywhere. It asks your installed keychain or 1Password CLI for each approved value.</p>
    <h2>Site data</h2><p>The site does not use analytics or cookies. If you enter a license, your browser stores it under <code>${LICENSE_KEY}</code>.</p>
    <h2>License checks</h2><p>The site sends the license token to Sociobot only when you add or verify it. The cached result lasts one day.</p>
    <h2>Demo data</h2><p>The browser demo uses only bundled sample text. Resetting it clears the <code>demo:</code> session keys.</p>
    <h2>Contact</h2><p>Questions can go to <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>`);
}

function terms(): string {
  return legal('Terms — Worktree Secret Broker', 'Terms for using the broker', `
    <p>Worktree Secret Broker is provided under the MIT License, without warranty. You remain responsible for the credentials and commands you use.</p>
    <h2>Safe use</h2><p>Use development credentials. Review each mapping. Do not treat a process environment as a vault.</p>
    <h2>Purchases</h2><p>Team policy tools cost $19 once. Sociobot and Dodo are the merchant of record. A refund revokes its license.</p>
    <h2>Changes</h2><p>These terms apply to version 0.1.0 and were updated on 28 August 2026.</p>`);
}

function legal(title: string, heading: string, body: string): string {
  document.title = title;
  return shell(`<article class="legal"><p class="eyebrow">Plain terms</p><h1 tabindex="-1">${heading}</h1>${body}</article>`);
}

function notFound(): string {
  return shell(`<section class="lost"><div class="lost-key" aria-hidden="true">?</div><p class="eyebrow">404 · no lease here</p><h1 tabindex="-1">This path has no worktree</h1><p>The page may have moved. The broker itself is still where you left it.</p><a class="button" href="/" data-link>Return home</a></section>`);
}

function render(push = false): void {
  const route = routeFor(location.pathname);
  if (route !== '/privacy' && route !== '/terms') {
    const titles: Record<Route, string> = {
      '/': 'Worktree Secret Broker — Lease development secrets',
      '/demo': 'Demo — Worktree Secret Broker',
      '/privacy': 'Privacy — Worktree Secret Broker',
      '/terms': 'Terms — Worktree Secret Broker',
      '/not-found': 'Page not found — Worktree Secret Broker',
    };
    document.title = titles[route];
  }
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = route === '/demo'
    ? 'Watch the real CLI run with isolated sample data and a names-only lease receipt.'
    : 'Give one worktree process only the development secrets it needs, without copying a secret file.';
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = `https://worktree-secret-broker.sociobot.in${route === '/not-found' ? location.pathname : route}`;
  const app = document.querySelector<HTMLDivElement>('#app')!;
  app.innerHTML = route === '/' ? home() : route === '/demo' ? demo() : route === '/privacy' ? privacy() : route === '/terms' ? terms() : notFound();
  bindActions();
  if (push) {
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    const h1 = document.querySelector<HTMLHeadingElement>('h1')!;
    h1.focus({ preventScroll: true });
    document.querySelector('#route-status')!.textContent = h1.textContent;
  }
}

function bindActions(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-link]').forEach(link => link.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); history.pushState({}, '', link.href); render(true);
  }));
  document.querySelector('[data-reset-demo]')?.addEventListener('click', () => {
    Object.keys(sessionStorage).filter(key => key.startsWith('demo:')).forEach(key => sessionStorage.removeItem(key));
    sessionStorage.setItem('demo:reset', String(Date.now())); render(false);
    document.querySelector<HTMLButtonElement>('[data-reset-demo]')?.focus();
  });
  document.querySelector<HTMLButtonElement>('[data-copy]')?.addEventListener('click', async event => {
    const button = event.currentTarget as HTMLButtonElement;
    try { await navigator.clipboard.writeText(button.dataset.copy ?? ''); button.textContent = 'Copied'; }
    catch { button.textContent = 'Copy failed — select the command'; }
  });
  document.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const token = new FormData(event.currentTarget as HTMLFormElement).get('license')?.toString().trim() ?? '';
    if (!token) { setLicenseStatus('Paste a license token, then verify it.'); return; }
    localStorage.setItem(LICENSE_KEY, token);
    await verifyLicense(token, true);
  });
  document.querySelector<HTMLFormElement>('#policy-desk')?.addEventListener('submit', event => {
    event.preventDefault();
    const names = (document.querySelector<HTMLTextAreaElement>('#policy-names')?.value ?? '').split(/\s+/).filter(Boolean);
    const invalid = names.find(name => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name));
    const output = document.querySelector<HTMLElement>('#policy-output')!;
    if (!names.length || invalid) { output.textContent = invalid ? `${invalid} is not a valid variable name.` : 'Add at least one variable name.'; return; }
    const provider = document.querySelector<HTMLSelectElement>('#policy-provider')!.value;
    const ttl = document.querySelector<HTMLSelectElement>('#policy-ttl')!.value;
    const blocks = names.map(name => `[[secrets]]\nname = "${name}"\nsource = "${provider === 'op' ? `op://Development/${name}/value` : `keychain://team/${name.toLowerCase()}`}"\nlabels = ["development"]`).join('\n\n');
    output.textContent = `# Team review: production labels remain denied by default.\nversion = 1\nlease_minutes = ${ttl}\n\n${blocks}`;
  });
}

function setLicenseStatus(message: string): void {
  const status = document.querySelector('#license-status'); if (status) status.textContent = message;
}

function showPolicyDesk(active: boolean): void {
  const desk = document.querySelector<HTMLElement>('#policy-desk');
  if (desk) desk.hidden = !active;
}

async function verifyLicense(token: string, force = false): Promise<void> {
  const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null') as { valid: boolean; checkedAt: number } | null;
  if (cached?.valid) showPolicyDesk(true);
  if (!force && cached && Date.now() - cached.checkedAt < DAY) {
    if (cached.valid) setLicenseStatus('Team policy tools are active on this device.');
    return;
  }
  setLicenseStatus('Checking the license…');
  try {
    const response = await fetch(`${API}/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('request failed');
    const result = await response.json() as { valid: boolean };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, checkedAt: Date.now() }));
    showPolicyDesk(result.valid);
    setLicenseStatus(result.valid ? 'Team policy tools are active on this device.' : 'License no longer active. Check the token or buy a new license.');
  } catch { setLicenseStatus('The license check is offline. The free CLI still works. Try again later.'); }
}

function acceptReturnedLicense(): void {
  const url = new URL(location.href); const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(LICENSE_KEY, token); url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

window.addEventListener('popstate', () => render(true));
acceptReturnedLicense(); render();
const savedLicense = localStorage.getItem(LICENSE_KEY); if (savedLicense) void verifyLicense(savedLicense);
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  void navigator.serviceWorker.register('/sw.js');
}
