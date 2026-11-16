/**
 * Fire Tree · 湖南化改造后的关键交互冒烟（真实点击按钮 / 表单）
 *
 * 覆盖：门户分类筛选、学习页笔记保存（保存后还原）、打卡、社区点赞、
 *       管理端节点检索与重置、大屏地图、资讯运营行切换详情。
 *
 * 用法（在 frontend/ 目录下）：node scripts/hunan-interactions.mjs
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:5173';
const API = process.env.SMOKE_API || 'http://127.0.0.1:8080';
const SECRET = process.env.SMOKE_SECRET || 'change-me-to-a-long-random-secret';
const OUTPUT_DIR = path.resolve(process.cwd(), '..', 'output', 'hunan-smoke');

const base64Url = (value) => Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function tokenFor(id, username) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(`sub=${id};username=${username};exp=${Math.floor(Date.now() / 1000) + 86400}`);
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${base64Url(crypto.createHmac('sha256', SECRET).update(unsigned).digest())}`;
}
const TOKENS = {
  user: tokenFor(4372, 'wenhuaiyonghu'),
  admin: tokenFor(4370, 'admin'),
};

async function api(method, endpoint, persona, body) {
  const response = await fetch(`${API}${endpoint}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(TOKENS[persona] ? { Authorization: `Bearer ${TOKENS[persona]}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { status: response.status, json, text };
}

const steps = [];
async function step(name, fn) {
  try {
    const detail = await fn();
    steps.push({ name, ok: true, detail: detail || '' });
    console.log(`PASS  ${name}${detail ? ` → ${detail}` : ''}`);
  } catch (error) {
    steps.push({ name, ok: false, detail: String(error.message).slice(0, 220) });
    console.log(`FAIL  ${name} → ${String(error.message).slice(0, 220)}`);
  }
}

async function launch() {
  for (const options of [{ channel: 'chrome', headless: true }, { channel: 'msedge', headless: true }, { headless: true }]) {
    try { return await chromium.launch(options); } catch { /* try next */ }
  }
  throw new Error('没有可用的浏览器');
}

async function withPage(browser, persona, fn) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  await context.addInitScript((value) => {
    if (value) window.localStorage.setItem('heritage-auth-token', value);
  }, persona ? TOKENS[persona] : null);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    // 个人页内置的音乐播放器会依次尝试第三方歌词源，浏览器必然 CORS 拦截，属既有外部依赖
    if (message.type() === 'error' && !/music\.163\.com|music\.126\.net|gdstudio\.xyz|allorigins\.win|ERR_FAILED/.test(message.text())) {
      consoleErrors.push(message.text().slice(0, 200));
    }
  });
  try {
    return await fn(page);
  } finally {
    if (consoleErrors.length) {
      steps.push({ name: '控制台错误', ok: false, detail: consoleErrors.join(' || ').slice(0, 300) });
      console.log(`WARN  控制台错误：${consoleErrors.join(' || ').slice(0, 200)}`);
    }
    await context.close();
  }
}

async function main() {
  const browser = await launch();

  await withPage(browser, null, async (page) => {
    await step('门户 /explore 分类筛选（传统美术 → 全部）', async () => {
      await page.goto(`${BASE}/explore`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1800);
      const all = await page.evaluate(() => document.body.innerText);
      await page.getByRole('button', { name: '传统美术', exact: true }).first().click();
      await page.waitForTimeout(1500);
      const filtered = await page.evaluate(() => document.body.innerText);
      if (filtered === all) throw new Error('切换分类后内容没有变化');
      if (!filtered.includes('传统美术')) throw new Error('筛选结果缺少分类标记');
      await page.getByRole('button', { name: '全部', exact: true }).first().click();
      await page.waitForTimeout(1200);
      return '分类筛选生效并可还原';
    });
  });

  await withPage(browser, 'user', async (page) => {
    await step('学习页：填写并保存笔记后还原', async () => {
      await page.goto(`${BASE}/favorites/study/41001`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1800);
      const textarea = page.locator('textarea').first();
      const original = await textarea.inputValue();
      const probe = `交互冒烟-${Date.now()}`;
      await textarea.fill(probe);
      await page.getByRole('button', { name: /保存笔记/ }).first().click();
      await page.waitForTimeout(1500);
      const body = await page.evaluate(() => document.body.innerText);
      if (!/笔记已保存|已保存/.test(body)) throw new Error(`未出现保存成功提示：${body.slice(0, 120)}`);
      const restored = await api('PUT', '/api/favorites/nodes/41001', 'user', { userId: 4372, note: original });
      if (restored.status !== 200) throw new Error(`还原笔记失败：${restored.status}`);
      return `保存成功并已还原原笔记（${original.length} 字）`;
    });

    await step('学习页：打卡按钮可用', async () => {
      await page.goto(`${BASE}/favorites/checkin`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      const before = await page.evaluate(() => document.body.innerText);
      const button = page.getByRole('button', { name: /打卡|签到/ }).first();
      if (!(await button.count())) throw new Error('未找到打卡按钮');
      if (await button.isDisabled()) return '按钮存在且处于已完成/禁用态（当日已打卡）';
      await button.click();
      await page.waitForTimeout(1200);
      const after = await page.evaluate(() => document.body.innerText);
      if (after === before) throw new Error('点击后页面无变化');
      return '点击打卡后页面状态更新';
    });

    await step('社区问答：帖子点赞按钮可点', async () => {
      await page.goto(`${BASE}/qa`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      const like = page.locator('.thread-mini').first();
      if (!(await like.count())) throw new Error('未找到点赞按钮');
      const beforeClass = await like.getAttribute('class');
      const beforeText = (await like.innerText()).trim();
      await like.click();
      await page.waitForTimeout(2000);
      const afterClass = await page.locator('.thread-mini').first().getAttribute('class');
      const afterText = (await page.locator('.thread-mini').first().innerText()).trim();
      if (beforeClass === afterClass && beforeText === afterText) {
        throw new Error(`点赞后状态与计数都未变化（${beforeText}/${beforeClass}）`);
      }
      await page.locator('.thread-mini').first().click();   // 还原点赞状态
      await page.waitForTimeout(1000);
      return `点赞状态变化：${beforeText}(${beforeClass}) → ${afterText}(${afterClass})，并已取消`;
    });
  });

  await withPage(browser, 'admin', async (page) => {
    await step('管理端节点管理：关键词检索与重置', async () => {
      await page.goto(`${BASE}/admin/graph/nodes`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1800);
      const input = page.locator('input[type="search"][placeholder="名称、编码、简介"]').first();
      await input.fill('湘绣');
      await page.locator('button.primary-action.compact', { hasText: '搜索' }).first().click();
      await page.waitForTimeout(1600);
      const filtered = await page.evaluate(() => document.body.innerText);
      if (!filtered.includes('湘绣')) throw new Error('检索结果未包含湘绣');
      await page.locator('button.secondary-action.compact', { hasText: '重置' }).first().click();
      await page.waitForTimeout(1400);
      return '检索命中湘绣，重置成功';
    });

    await step('管理端大屏地图：湖南省域热力渲染', async () => {
      await page.goto(`${BASE}/admin/analytics/map`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
      const text = await page.evaluate(() => document.body.innerText);
      if (!text.includes('湖南省域热力')) throw new Error('未渲染湖南省域热力面板');
      if (!/湖南/.test(text)) throw new Error('地图面板没有湖南数据');
      return '湖南省域热力面板已渲染';
    });

    await step('管理端资讯运营：点击行切换详情', async () => {
      await page.goto(`${BASE}/admin/content/articles`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1800);
      const before = await page.evaluate(() => document.body.innerText);
      const rows = page.locator('.data-table tbody tr');
      const count = await rows.count();
      if (count < 2) throw new Error(`列表行数不足：${count}`);
      await rows.nth(1).click();
      await page.waitForTimeout(1200);
      const after = await page.evaluate(() => document.body.innerText);
      if (after === before) throw new Error('点击行后页面无变化');
      return `点击第 2 行后详情更新（共 ${count} 行）`;
    });
  });

  await browser.close();
  const failed = steps.filter((item) => !item.ok);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const file = path.join(OUTPUT_DIR, `interactions-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify({ base: BASE, generatedAt: new Date().toISOString(), steps }, null, 2), 'utf8');
  console.log(`\n合计 ${steps.length} 个交互，失败 ${failed.length} 个；明细：${file}`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exit(2); });
