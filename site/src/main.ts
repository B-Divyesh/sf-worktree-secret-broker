import './style.css';

type Route = '/' | '/demo' | '/privacy' | '/terms' | '/not-found';

type Metadata = { title: string; description: string; canonical: string };

const metadata: Record<Route, Metadata> = {
  '/': {
    title: 'Worktree Secret Broker — Lease development secrets',
    description: 'Give one worktree process only the development secrets it needs, without copying a secret file.',
    canonical: '/',
  },
  '/demo': {
    title: 'Demo — Worktree Secret Broker',
    description: 'See the CLI run with isolated sample worktree data and a names-only receipt.',
    canonical: '/demo',
  },
  '/privacy': {
    title: 'Privacy — Worktree Secret Broker',
    description: 'Read how the CLI and its isolated browser sample handle local data.',
    canonical: '/privacy',
  },
  '/terms': {
    title: 'Terms — Worktree Secret Broker',
    description: 'Read the MIT license terms and safe-use limits for Worktree Secret Broker.',
    canonical: '/terms',
  },
  '/not-found': {
    title: 'Page not found — Worktree Secret Broker',
    description: 'Return to Worktree Secret Broker from a path that does not exist.',
    canonical: '/404',
  },
};

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[char] ?? char));

function routeFor(path: string): Route {
  if (path === '/' || path === '/demo' || path === '/privacy' || path === '/terms') return path;
  return '/not-found';
}

function shell(content: string, demo = false): string {
  return `
    ${demo ? `<aside class="demo-banner" aria-label="Demo mode"><span>Demo — sample data, nothing is saved to your real data</span><span class="demo-actions"><button type="button" data-reset-demo>Reset demo</button><a href="/" data-link>Start for real</a></span></aside>` : ''}
    <header class="site-header">
      <a class="wordmark" href="/" data-link aria-label="Worktree Secret Broker home"><span class="key-mark" aria-hidden="true"></span><span>Worktree<br>Secret Broker</span></a>
      <nav aria-label="Main navigation"><a href="/demo" data-link>Demo</a><a href="/#install" data-link>Install</a><a href="/privacy" data-link>Privacy</a></nav>
    </header>
    <main id="main">${content}</main>
    <footer>
      <p>Temporary secret leases for worktree processes.</p>
      <nav aria-label="Footer navigation"><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a><a href="https://sociobot.in/" rel="external">Built by Param Factory <span class="sr-only">(external site)</span></a></nav>
      <p>Version 0.1.0 · build 2026.08.29</p>
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
    ${live ? '<p class="terminal-note">This sample uses the bundled names and receipt fields from <code>wsb demo</code>. The CLI creates and removes its own temporary directory.</p>' : ''}
  </section>`;

function home(): string {
  return shell(`
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Local CLI · v0.1.0</p>
        <h1 tabindex="-1">Lease secrets to one worktree process</h1>
        <p class="lede">For developers running coding agents, each worktree gets only approved development variables.</p>
        <div class="hero-action"><a class="button" href="/?demo=1" data-link>Try it with sample data</a><span>Opens an isolated recorded CLI run.</span></div>
        <ul class="plain-facts"><li>Only approved variables enter the child.</li><li>Receipts list names, never values.</li><li>Production labels are denied by default.</li></ul>
      </div>
      <figure class="hero-art"><img src="/key-orchard.webp" width="1200" height="800" alt="Three brass keys descend toward one lit worktree while distant keyholes stay dark." fetchpriority="high"><figcaption>Only approved variables reach the named worktree process.</figcaption></figure>
    </section>
    <section class="product-preview" aria-labelledby="preview-heading">
      <div class="section-intro"><p class="eyebrow">Sample names-only receipt</p><h2 id="preview-heading">The receipt shows names, never values</h2><p>The recording uses the demo’s two bundled names.</p></div>
      ${terminal()}
    </section>
    <section class="steps" id="install" aria-labelledby="steps-heading">
      <p class="eyebrow">How it works</p><h2 id="steps-heading">Run one worktree process in three steps</h2>
      <ol>
        <li><span>01</span><div><h3>Map approved names</h3><p>Point each variable name at Keychain, Secret Service, or 1Password.</p><code>DATABASE_URL → keychain://my-app/database-url</code></div></li>
        <li><span>02</span><div><h3>Name the worktree</h3><p>The broker checks the Git root before starting one child process.</p><code>wsb run --worktree ../agent-42 -- npm test</code></div></li>
        <li><span>03</span><div><h3>Read the receipt</h3><p>Expiry stops the child. The receipt lists names, timing, and outcome.</p><code>outcome: child-exited · names: NPM_TOKEN</code></div></li>
      </ol>
      <div class="install-line"><div><code>cargo install --git https://github.com/B-Divyesh/sf-worktree-secret-broker.git --locked</code><a class="source-link" href="https://github.com/B-Divyesh/sf-worktree-secret-broker" rel="external">View source <span class="sr-only">(external site)</span></a></div><button type="button" data-copy="cargo install --git https://github.com/B-Divyesh/sf-worktree-secret-broker.git --locked">Copy install command</button></div>
    </section>
    <section class="limits" aria-labelledby="limits-heading">
      <div><p class="eyebrow">Limits</p><h2 id="limits-heading">What the broker does not do</h2></div>
      <ul><li>It does not host a vault.</li><li>It does not scan repositories.</li><li>It denies production-labelled entries by default.</li><li>It cannot hide variables from the child that needs them.</li></ul>
    </section>
    ${policySection()}
  `);
}

function policySection(): string {
  return `<section class="paid" aria-labelledby="policy-heading">
    <div><p class="eyebrow">Local policy helper</p><h2 id="policy-heading">Generate a names-only team policy</h2><p>Enter variable names. The helper creates development-only provider references in this browser.</p></div>
    <form id="policy-desk" class="policy-desk">
      <div class="policy-fields"><label for="policy-names">Approved variable names <textarea id="policy-names" rows="3">DATABASE_URL\nNPM_TOKEN</textarea></label><label for="policy-provider">Provider <select id="policy-provider"><option value="keychain">OS keychain</option><option value="op">1Password</option></select></label><label for="policy-ttl">Lease length <select id="policy-ttl"><option value="5">5 minutes</option><option value="15" selected>15 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option></select></label></div>
      <button type="submit">Generate team policy</button><pre id="policy-output" tabindex="0" aria-live="polite"><code>Your names-only config will appear here.</code></pre>
    </form>
  </section>`;
}

function demo(): string {
  return shell(`
    <section class="demo-page">
      <p class="eyebrow">One-click sandbox</p><h1 tabindex="-1">See the CLI run with sample worktree data</h1>
      <p class="lede">This recording uses bundled sample names and an isolated temporary Git worktree.</p>
      ${terminal(true)}
      <div class="demo-grid"><section><h2>Sample input</h2><pre><code>DATABASE_URL
NPM_TOKEN
lease_minutes = 15</code></pre></section><section><h2>Observable result</h2><p>Two approved names reach the child. The temporary directory is removed after the receipt.</p></section></div>
      <div class="next-action"><a class="button" href="/#install" data-link>Install the real CLI</a><span>Then map your own keychain references.</span></div>
    </section>`, true);
}

function privacy(): string {
  return legal('Privacy — Worktree Secret Broker', 'Privacy stays local', `
    <p>The CLI resolves only the provider references in your config. It passes resolved values to the child process you start.</p>
    <h2>Site data</h2><p>The site has no analytics. The browser demo uses bundled sample text. Reset demo returns the recording to its first frame.</p>
    <h2>Contact</h2><p>Questions can go to <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>`);
}

function terms(): string {
  return legal('Terms — Worktree Secret Broker', 'Terms for using the broker', `
    <p>Worktree Secret Broker is provided under the MIT License, without warranty. You remain responsible for the credentials and commands you use.</p>
    <h2>Safe use</h2><p>Use development credentials. Review each mapping. Do not treat a process environment as a vault.</p>
    <h2>Changes</h2><p>These terms apply to version 0.1.0 and were updated on 28 August 2026.</p>`);
}

function legal(_title: string, heading: string, body: string): string {
  return shell(`<article class="legal"><p class="eyebrow">Plain terms</p><h1 tabindex="-1">${heading}</h1>${body}</article>`);
}

function notFound(): string {
  return shell(`<section class="lost"><div class="lost-key" aria-hidden="true">?</div><p class="eyebrow">404 · no lease here</p><h1 tabindex="-1">This path has no worktree</h1><p>The page may have moved. The broker itself is still where you left it.</p><a class="button" href="/" data-link>Return home</a></section>`);
}

type RenderMode = 'initial' | 'navigate' | 'pop';

function hashTarget(): HTMLElement | null {
  return location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
}

function focusAndScroll(target: HTMLElement | null, top: number): void {
  const focusTarget = target?.querySelector<HTMLElement>('h2') ?? document.querySelector<HTMLHeadingElement>('h1')!;
  focusTarget.tabIndex = -1;
  focusTarget.focus({ preventScroll: true });
  window.scrollTo({ top, behavior: 'instant' });
  document.querySelector('#route-status')!.textContent = focusTarget.textContent;
}

let restoringScroll = false;
const demoSessionKeys = ['demo:session', 'demo:changed-frame'];

function isDemoEntry(): boolean {
  return location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
}

function clearDemoStorage(): void {
  // Keep this list explicit: reset must not enumerate, read, or mutate real
  // browser storage while the sample banner is visible.
  demoSessionKeys.forEach(key => sessionStorage.removeItem(key));
}

function enterDemoStorage(): void {
  sessionStorage.setItem('demo:session', 'sample-receipt');
}

function setMetadata(route: Route): void {
  const current = metadata[route];
  const origin = 'https://worktree-secret-broker.sociobot.in';
  document.title = current.title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = current.description;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = `${origin}${current.canonical}`;
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')!.content = current.title;
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')!.content = current.description;
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')!.content = current.title;
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')!.content = current.description;
}

function render(mode: RenderMode = 'initial', savedScroll = 0): void {
  const route = isDemoEntry() ? '/demo' : routeFor(location.pathname);
  if (route === '/demo') enterDemoStorage();
  setMetadata(route);
  const app = document.querySelector<HTMLDivElement>('#app')!;
  app.innerHTML = route === '/' ? home() : route === '/demo' ? demo() : route === '/privacy' ? privacy() : route === '/terms' ? terms() : notFound();
  bindActions();
  const target = hashTarget();
  if (mode === 'navigate' || (mode === 'initial' && target)) {
    requestAnimationFrame(() => focusAndScroll(target, target?.offsetTop ?? 0));
  } else if (mode === 'pop') {
    restoringScroll = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      focusAndScroll(target, target?.offsetTop ?? savedScroll);
      requestAnimationFrame(() => { restoringScroll = false; });
    }));
  }
}

function bindActions(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-link]').forEach(link => link.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.replaceState({ ...history.state, scrollY }, '', location.href);
    if (link.closest('.demo-banner')) clearDemoStorage();
    history.pushState({ scrollY: 0 }, '', link.href); render('navigate');
  }));
  document.querySelector('[data-reset-demo]')?.addEventListener('click', () => {
    clearDemoStorage();
    enterDemoStorage();
    render();
    document.querySelector<HTMLButtonElement>('[data-reset-demo]')?.focus();
  });
  document.querySelector<HTMLButtonElement>('[data-copy]')?.addEventListener('click', async event => {
    const button = event.currentTarget as HTMLButtonElement;
    try { await navigator.clipboard.writeText(button.dataset.copy ?? ''); button.textContent = 'Copied'; }
    catch { button.textContent = 'Copy failed — select the command'; }
  });
  document.querySelector<HTMLFormElement>('#policy-desk')?.addEventListener('submit', event => {
    event.preventDefault();
    const names = (document.querySelector<HTMLTextAreaElement>('#policy-names')?.value ?? '').split(/\s+/).filter(Boolean);
    const invalid = names.find(name => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name));
    const output = document.querySelector<HTMLElement>('#policy-output')!;
    if (!names.length || invalid) { output.textContent = invalid ? `${invalid} is not a valid variable name.` : 'Add at least one variable name.'; return; }
    const duplicate = names.find((name, index) => names.indexOf(name) !== index);
    if (duplicate) { output.textContent = `${duplicate} is approved more than once. Keep one entry.`; return; }
    const provider = document.querySelector<HTMLSelectElement>('#policy-provider')!.value;
    const ttl = document.querySelector<HTMLSelectElement>('#policy-ttl')!.value;
    const blocks = names.map(name => `[[secrets]]\nname = "${name}"\nsource = "${provider === 'op' ? `op://Development/${name}/value` : `keychain://team/${name.toLowerCase()}`}"\nlabels = ["development"]`).join('\n\n');
    output.textContent = `# Team review: production labels remain denied by default.\nversion = 1\nlease_minutes = ${ttl}\n\n${blocks}`;
  });
}

window.addEventListener('popstate', event => {
  render('pop', Number(event.state?.scrollY ?? 0));
});
history.scrollRestoration = 'manual';
history.replaceState({ ...history.state, scrollY }, '', location.href);
let scrollFrame = 0;
addEventListener('scroll', () => {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    if (!restoringScroll) history.replaceState({ ...history.state, scrollY }, '', location.href);
  });
}, { passive: true });
render('initial');
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  void navigator.serviceWorker.register('/sw.js');
}
