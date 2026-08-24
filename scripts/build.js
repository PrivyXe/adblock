import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { validateAllRules } from './validate-rules.js';

const isWatch = process.argv.includes('--watch');
const distDir = path.resolve('dist');

function cleanDist() {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(path.join(distDir, 'icons'), { recursive: true });
  fs.mkdirSync(path.join(distDir, 'rules'), { recursive: true });
  fs.mkdirSync(path.join(distDir, 'popup'), { recursive: true });
  fs.mkdirSync(path.join(distDir, 'options'), { recursive: true });
  fs.mkdirSync(path.join(distDir, 'background'), { recursive: true });
}

function compileRules() {
  console.log('Compiling static declarativeNetRequest rulesets...');

  // 1. Ads Ruleset
  const adsBase = JSON.parse(fs.readFileSync('rules/ads/base.json', 'utf8'));
  const adsNetworks = JSON.parse(fs.readFileSync('rules/ads/networks.json', 'utf8'));
  const compiledAds = [...adsBase, ...adsNetworks];
  fs.writeFileSync(path.join(distDir, 'rules/ads.json'), JSON.stringify(compiledAds, null, 2));

  // 2. Trackers Ruleset
  const trackersAnalytics = JSON.parse(fs.readFileSync('rules/trackers/analytics.json', 'utf8'));
  const trackersTracking = JSON.parse(fs.readFileSync('rules/trackers/tracking.json', 'utf8'));
  const trackersTelemetry = JSON.parse(fs.readFileSync('rules/trackers/telemetry.json', 'utf8'));
  const compiledTrackers = [...trackersAnalytics, ...trackersTracking, ...trackersTelemetry];
  fs.writeFileSync(path.join(distDir, 'rules/trackers.json'), JSON.stringify(compiledTrackers, null, 2));

  // 3. Sites Ruleset
  const sites = JSON.parse(fs.readFileSync('rules/sites/site-specific.json', 'utf8'));
  fs.writeFileSync(path.join(distDir, 'rules/sites.json'), JSON.stringify(sites, null, 2));

  console.log(`[PASS] Compiled ${compiledAds.length} Ads rules, ${compiledTrackers.length} Trackers rules, ${sites.length} Sites rules.`);
}

function copyStaticAssets() {
  console.log('Copying static assets and manifest...');

  // Manifest
  fs.copyFileSync('public/manifest.json', path.join(distDir, 'manifest.json'));

  // Icons
  const icons = ['icon-16.png', 'icon-32.png', 'icon-48.png', 'icon-128.png'];
  for (const icon of icons) {
    const srcIcon = path.join('public/icons', icon);
    if (fs.existsSync(srcIcon)) {
      fs.copyFileSync(srcIcon, path.join(distDir, 'icons', icon));
    }
  }

  // Popup HTML & CSS
  fs.copyFileSync('src/popup/popup.html', path.join(distDir, 'popup/popup.html'));
  fs.copyFileSync('src/popup/popup.css', path.join(distDir, 'popup/popup.css'));

  // Options HTML & CSS
  fs.copyFileSync('src/options/options.html', path.join(distDir, 'options/options.html'));
  fs.copyFileSync('src/options/options.css', path.join(distDir, 'options/options.css'));
}

async function build() {
  console.log('\n=== Starting Production Build for Chrome Extension ===');

  // Step 1: Validate Rules
  validateAllRules();

  // Step 2: Clean & Prep Directories
  cleanDist();

  // Step 3: Compile Static Rulesets
  compileRules();

  // Step 4: Copy Static Assets
  copyStaticAssets();

  // Step 5: Bundle TypeScript files with esbuild
  const entryPoints = [
    { in: 'src/background/service-worker.ts', out: 'background/service-worker' },
    { in: 'src/popup/popup.ts', out: 'popup/popup' },
    { in: 'src/options/options.ts', out: 'options/options' }
  ];

  const buildOptions = {
    entryPoints,
    outdir: distDir,
    bundle: true,
    format: 'esm',
    target: ['chrome102'],
    minify: !isWatch,
    sourcemap: isWatch ? 'inline' : false,
    legalComments: 'none',
    treeShaking: true,
  };

  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('[WATCH] Build watching for changes...');
  } else {
    await esbuild.build(buildOptions);
    console.log('[PASS] TypeScript bundles built successfully in dist/\n');
    console.log('=== Build Complete: Unpacked Extension Ready in dist/ ===\n');
  }
}

build().catch(err => {
  console.error('[FATAL] Build failed:', err);
  process.exit(1);
});
