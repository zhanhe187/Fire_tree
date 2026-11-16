import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./heritage-intro/heritageDisplay.ts', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/, '')
  .replace(/type HeritageDisplaySource = Partial<GraphNodeItem>;\r?\n/, '')
  .replace(/export type HeritageImageStatus = [^;]+;\r?\n/, '')
  .replace(/type DisplayPatch = \{[\s\S]*?\};\r?\n\r?\n/, '')
  .replace(/: Record<string, DisplayPatch>/g, '')
  .replace(/item: HeritageDisplaySource/g, 'item')
  .replace(/: HeritageImageStatus/g, '')
  .replace(/(\w+)\?: string/g, '$1');

const displayModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const { getHeritageDisplay } = displayModule;
const appSource = readFileSync(new URL('./heritage-intro/App.vue', import.meta.url), 'utf8');
const masonrySource = readFileSync(new URL('./heritage-intro/components/Masonry.vue', import.meta.url), 'utf8');

test('classifies a Hunan project image as a real project image', () => {
  const display = getHeritageDisplay({
    nodeCode: 'hunan_project_xiangxiu',
    coverImageUrl: '/heritage-media/hunan-project/xiangxiu.jpg',
    coverImageCaption: '湘绣项目图',
  });

  assert.equal(display.imageStatus, 'REAL_PROJECT_IMAGE');
  assert.equal(display.coverImageUrl, '/heritage-media/hunan-project/xiangxiu.jpg');
});

test('classifies an uploaded material image as a real image instead of a category cover', () => {
  const display = getHeritageDisplay({
    name: '女书习俗与瑶族文化特展',
    coverImageUrl: '/uploads/media/submissions/43600/2026/10/sample.webp',
    coverImageCaption: '特展现场图',
  });

  assert.equal(display.imageStatus, 'REAL_PROJECT_IMAGE');
  assert.deepEqual(display.missingFields, []);
});

test('classifies a non-project heritage image as a category fallback', () => {
  const display = getHeritageDisplay({
    nodeCode: 'hunan_project_xiangxiu',
    coverImageUrl: '/heritage-media/embroidery-cover.jpg',
  });

  assert.equal(display.imageStatus, 'CATEGORY_FALLBACK');
  assert.deepEqual(display.missingFields, ['图像说明']);
});

test('classifies every known category cover as a category fallback', () => {
  for (const coverImageUrl of [
    '/heritage-media/embroidery-cover.jpg',
    '/heritage-media/region-cover.jpg',
    '/heritage-media/folk-literature-cover.jpg',
  ]) {
    const display = getHeritageDisplay({ nodeCode: 'hunan_project_xiangxiu', coverImageUrl });
    assert.equal(display.imageStatus, 'CATEGORY_FALLBACK', coverImageUrl);
  }
});

test('uses status-specific captions for real, category, and missing images', () => {
  const realWithCaption = getHeritageDisplay({
    name: '湘绣',
    coverImageUrl: '/heritage-media/hunan-project/xiangxiu.jpg',
    coverImageCaption: '湘绣实拍',
  });
  assert.equal(realWithCaption.coverImageCaption, '湘绣实拍');

  const realWithoutCaption = getHeritageDisplay({
    name: '湘绣',
    coverImageUrl: '/heritage-media/hunan-project/xiangxiu.jpg',
  });
  assert.equal(realWithoutCaption.coverImageCaption, '湘绣项目图');

  for (const coverImageUrl of [
    '/heritage-media/embroidery-cover.jpg',
    '/heritage-media/region-cover.jpg',
    '/heritage-media/folk-literature-cover.jpg',
  ]) {
    const display = getHeritageDisplay({ name: '湘绣', coverImageUrl });
    assert.equal(display.coverImageCaption, '湘绣类别示意图', coverImageUrl);
    assert.doesNotMatch(display.coverImageCaption, /真实图像|真实影像/);
  }

  const unescoPatch = getHeritageDisplay({ nodeCode: 'hunan_unesco_kunqu' });
  assert.equal(unescoPatch.coverImageCaption, '湘昆舞台表演展示图');
  assert.doesNotMatch(unescoPatch.coverImageCaption, /真实图像|真实影像/);

  const noImage = getHeritageDisplay({ name: '湘绣' });
  assert.equal(noImage.coverImageCaption, '未有图像信息');
});

test('preserves the legacy display fields alongside imageStatus', () => {
  const display = getHeritageDisplay({
    nodeCode: 'hunan_project_xiangxiu',
    name: '湘绣',
    category: '传统美术',
    nodeTypeName: '非遗项目',
    projectLevel: '国家级',
    summary: '项目摘要',
    content: '项目内容',
    coverImageUrl: '/heritage-media/hunan-project/xiangxiu.jpg',
    coverImageCaption: '项目图',
    sourceName: '湖南来源',
  });

  for (const field of [
    'category',
    'nodeTypeName',
    'projectLevel',
    'summary',
    'content',
    'coverImageUrl',
    'coverImageCaption',
    'hasCoverImage',
    'missingFields',
    'sourceName',
  ]) {
    assert.ok(field in display, `missing legacy field: ${field}`);
  }
});

test('portal labels images by image status instead of hasCoverImage', () => {
  assert.match(appSource, /imageLabel:\s*display\.imageStatus\s*===\s*'REAL_PROJECT_IMAGE'/);
  assert.doesNotMatch(appSource, /imageLabel:\s*display\.hasCoverImage\s*\?\s*'真实影像'/);
  assert.match(appSource, /'CATEGORY_FALLBACK'/);
  assert.match(appSource, /'未有图像信息'/);
});

test('masonry real-image class is reserved for real project images', () => {
  assert.match(masonrySource, /has-real-image[\s\S]*?imageStatus\s*===\s*'REAL_PROJECT_IMAGE'/);
  assert.doesNotMatch(masonrySource, /has-real-image.*item\.hasCoverImage/);
});

test('classifies a missing image as no image', () => {
  const display = getHeritageDisplay({ nodeCode: 'hunan_project_xiangxiu' });

  assert.equal(display.imageStatus, 'NO_IMAGE');
  assert.equal(display.coverImageUrl, undefined);
  assert.deepEqual(display.missingFields, ['图像信息', '图像说明']);
});

test('keeps legacy UNESCO patch images as category fallbacks, never project images', () => {
  const display = getHeritageDisplay({ nodeCode: 'hunan_unesco_kunqu' });

  assert.equal(display.coverImageUrl, '/heritage-media/opera-kunqu-cover.jpg');
  assert.equal(display.imageStatus, 'CATEGORY_FALLBACK');
  assert.notEqual(display.imageStatus, 'REAL_PROJECT_IMAGE');
});
