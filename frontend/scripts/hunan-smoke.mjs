/**
 * Fire Tree · 湖南化改造后的浏览器全页冒烟
 *
 * 覆盖：门户端 + 用户端 + 管理端全部路由，采集 console 错误、页面异常与 4xx/5xx 请求，
 *       并断言每个页面出现预期的湖南内容。
 *
 * 用法（在 frontend/ 目录下）：node scripts/hunan-smoke.mjs
 * 可用环境变量：
 *   SMOKE_BASE   默认 http://127.0.0.1:5173
 *   SMOKE_SECRET 默认 change-me-to-a-long-random-secret（backend/.env 的 HERITAGE_AUTH_TOKEN_SECRET）
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:5173';
const SECRET = process.env.SMOKE_SECRET || 'change-me-to-a-long-random-secret';
const OUTPUT_DIR = path.resolve(process.cwd(), '..', 'output', 'hunan-smoke');

const PERSONAS = {
  anon: null,
  user: { id: 4372, username: 'wenhuaiyonghu' },
  inheritor: { id: 4371, username: 'chuanchengren' },
  admin: { id: 4370, username: 'admin' },
};

function base64Url(buffer) {
  return Buffer.from(buffer).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signToken(persona) {
  if (!persona) return null;
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + 86400;
  const payload = base64Url(`sub=${persona.id};username=${persona.username};exp=${exp}`);
  const unsigned = `${header}.${payload}`;
  const signature = base64Url(crypto.createHmac('sha256', SECRET).update(unsigned).digest());
  return `${unsigned}.${signature}`;
}

const PAGES = [
  ['portal', '/', 'anon', ['湖南非遗']],
  ['portal', '/explore', 'anon', ['湖南非遗', '湖南省']],
  ['portal', '/heritage/41001', 'anon', ['湘绣']],
  ['portal', '/articles', 'anon', []],
  ['portal', '/articles/1001', 'anon', []],
  ['portal', '/exhibitions', 'anon', []],
  ['portal', '/exhibitions/2001', 'anon', []],
  ['portal', '/products', 'anon', []],
  ['portal', '/products/3001', 'anon', []],
  ['portal', '/graph', 'anon', []],
  ['portal', '/graph/board', 'anon', []],
  ['portal', '/community', 'anon', []],
  ['portal', '/qa', 'anon', []],
  ['portal', '/qa/12001', 'anon', []],
  ['portal', '/login', 'anon', []],

  ['user', '/favorites', 'user', ['湘绣']],
  ['user', '/favorites/study/41001', 'user', ['湘绣']],
  ['user', '/favorites/checkin', 'user', []],
  ['user', '/profile', 'user', []],
  ['user', '/orders', 'user', []],
  ['user', '/material-submit', 'user', []],

  ['admin', '/admin/dashboard', 'admin', []],
  ['admin', '/admin/graph/board', 'admin', []],
  ['admin', '/admin/graph/nodes', 'admin', ['湖南省', '共 250 个节点']],
  ['admin', '/admin/graph/nodes/41001', 'admin', ['湘绣']],
  ['admin', '/admin/graph/edges', 'admin', []],
  ['admin', '/admin/review/applications', 'admin', []],
  ['admin', '/admin/review/risk', 'admin', []],
  ['admin', '/admin/content/media', 'admin', []],
  ['admin', '/admin/content/community', 'admin', []],
  ['admin', '/admin/content/community/12001', 'admin', []],
  ['admin', '/admin/content/governance', 'admin', []],
  ['admin', '/admin/content/products', 'admin', []],
  ['admin', '/admin/content/product-orders', 'admin', []],
  ['admin', '/admin/content/articles', 'admin', []],
  ['admin', '/admin/operations/favorites', 'admin', []],
  ['admin', '/admin/operations/learning', 'admin', []],
  ['admin', '/admin/operations/exhibitions', 'admin', []],
  ['admin', '/admin/system/users', 'admin', []],
  ['admin', '/admin/analytics/map', 'admin', ['湖南省域热力']],
];

const IGNORED_CONSOLE = [
  /favicon/i,
  /Download the Vue Devtools/i,
  /\[Vue warn\]: Failed to resolve component/i,
];

async function main() {
  // 本机只装了系统 Chrome/Edge（没有 Playwright 自带 chromium），因此优先走 channel
  const launch = async () => {
    const attempts = [
      { channel: 'chrome', headless: true },
      { channel: 'msedge', headless: true },
      { headless: true },
    ];
    let lastError = null;
    for (const options of attempts) {
      try {
        return await chromium.launch(options);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  };
  const browser = await launch();
  const results = [];
  for (const [group, route, personaKey, expectations] of PAGES) {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const token = signToken(PERSONAS[personaKey]);
    if (token) {
      await context.addInitScript((value) => {
        window.localStorage.setItem('heritage-auth-token', value);
      }, token);
    }
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const httpErrors = [];
    const externalNoise = [];
    // 站外第三方资源（个人页内置的网易云歌词/封面接口）在浏览器里必然被 CORS 拦截，
    // 属于既有外部依赖，不计入本次回归失败，但单独记录以便如实汇报。
    const isExternal = (text) => /music\.163\.com|music\.126\.net|gdstudio\.xyz|allorigins\.win|ERR_FAILED/.test(text);
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      if (IGNORED_CONSOLE.some((rule) => rule.test(message.text()))) return;
      if (isExternal(message.text())) { externalNoise.push(message.text().slice(0, 200)); return; }
      consoleErrors.push(message.text().slice(0, 300));
    });
    page.on('pageerror', (error) => pageErrors.push(String(error.message).slice(0, 300)));
    page.on('response', (response) => {
      const url = response.url();
      if (response.status() >= 400 && !url.includes('favicon')) {
        if (isExternal(url)) { externalNoise.push(`${response.status()} ${url}`); return; }
        httpErrors.push(`${response.status()} ${url.replace(BASE, '')}`);
      }
    });

    const started = Date.now();
    let navError = null;
    let bodyText = '';
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1600);
      bodyText = await page.evaluate(() => document.body.innerText);
    } catch (error) {
      navError = String(error.message).slice(0, 300);
    }
    const missing = expectations.filter((text) => !bodyText.includes(text));
    results.push({
      group, route, persona: personaKey, ms: Date.now() - started,
      consoleErrors, pageErrors, httpErrors, missing, navError, externalNoise,
      bodyLength: bodyText.length,
      bodySnippet: bodyText.replace(/\s+/g, ' ').slice(0, 900),
    });
    await context.close();
    const flag = consoleErrors.length || pageErrors.length || httpErrors.length || missing.length || navError ? 'FAIL' : 'ok  ';
    console.log(`${flag} ${group.padEnd(6)} ${route.padEnd(38)} ${personaKey.padEnd(9)} ${Date.now() - started}ms` +
      (missing.length ? ` missing=${JSON.stringify(missing)}` : '') +
      (consoleErrors.length ? ` console=${consoleErrors.length}` : '') +
      (pageErrors.length ? ` pageerror=${pageErrors.length}` : '') +
      (httpErrors.length ? ` http=${JSON.stringify(httpErrors.slice(0, 4))}` : ''));
  }
  await browser.close();

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(OUTPUT_DIR, `ui-sweep-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify({ base: BASE, generatedAt: new Date().toISOString(), results }, null, 2), 'utf8');

  const failed = results.filter((item) => item.consoleErrors.length || item.pageErrors.length || item.httpErrors.length || item.missing.length || item.navError);
  console.log(`\n合计 ${results.length} 个页面，异常 ${failed.length} 个；明细：${file}`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
