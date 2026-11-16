import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('favorites shell keeps the entry page and removes the extra particle showcase from learning space route', () => {
  const app = read('./heritage-intro/App.vue');

  assert.match(app, /<section v-if="currentPath === '\/favorites'"[\s\S]{0,400}我的非遗学习清单/);
  assert.match(app, /goPath\('\/favorites\/checkin'\)/);
  assert.match(app, /class="portal-function-section favorites-function-section favorites-direct-page"/);
  assert.match(
    app,
    /<LearningStudyPage v-if="currentPath\.startsWith\('\/favorites\/study\/'\)" \/>[\s\S]{0,120}<LearningCheckinPage v-else-if="currentPath\.startsWith\('\/favorites\/checkin'\)"[\s\S]{0,200}<LearningIndexPage v-else-if="currentPath === '\/favorites'"\s*\/>/,
  );

  assert.doesNotMatch(app, /进入收藏学习空间/);
  assert.doesNotMatch(app, /favorites-particle/);
  // Same orphan-token list as learningRedesignContract.test.mjs and layoutContract.test.mjs,
  // plus the retired portal workspace page (the admin FavoriteGraphPage.vue stays).
  assert.doesNotMatch(app, /ModelParticleField|GlitchText|heritageStackImages|Stack\.vue|FavoriteGraphPage/);
});

// The old single-page workspace test ('favorite learning space uses a website-style layout
// with compact hero and content zones') was deleted in Task 7: it read the retired
// portal/FavoriteGraphPage.vue and asserted the learning-space-kicker / learning-space-row-primary
// structure that no longer exists. The card-index structure is covered by
// learningRedesignContract.test.mjs; the checkin calendar by layoutContract.test.mjs.
