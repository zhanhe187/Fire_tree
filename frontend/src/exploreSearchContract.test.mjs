import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('./heritage-intro/App.vue', import.meta.url), 'utf8');
const mapper = readFileSync(
  new URL('../../backend/src/main/java/com/firetree/heritage/features/graph/mapper/GraphNodeMapper.java', import.meta.url),
  'utf8',
);

test('explore page exposes a search box that submits to the backend', () => {
  assert.match(app, /class="explore-search"/);
  assert.match(app, /type="search"/);
  assert.match(app, /@submit\.prevent="submitExploreSearch"/);
  assert.match(app, /async function searchExploreNodes/);
});

test('search results are paged through the whole result set', () => {
  assert.match(app, /const EXPLORE_PAGE_SIZE = 100/);
  assert.match(app, /const EXPLORE_MAX_PAGES = 5/);
  assert.match(app, /size: EXPLORE_PAGE_SIZE/);
  assert.match(app, /page \* EXPLORE_PAGE_SIZE >= total/);
  assert.match(app, /exploreTruncated\.value = total > EXPLORE_MAX_PAGES \* EXPLORE_PAGE_SIZE/);
});

test('search term is mirrored into the ?q= query string and read back on entry', () => {
  assert.match(app, /exploreKeyword = ref\(String\(route\.query\.q \?\? ''\)\)/);
  assert.match(app, /router\.replace\(\{ path: '\/explore', query: keyword \? \{ q: keyword \} : \{\} \}\)/);
  assert.match(app, /watch\(\(\) => route\.fullPath/);
});

test('search resets the category filter and keeps the completeness count on the full data set', () => {
  assert.match(app, /activeCategory\.value = '全部'/);
  assert.match(app, /allExploreNodes\.value/);
});

test('backend keyword also matches province and city', () => {
  assert.match(mapper, /n\.province like \?/);
  assert.match(mapper, /n\.city like \?/);
});
