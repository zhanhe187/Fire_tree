import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('article and exhibition services expose linked product contracts', () => {
  const product = read('./features/product/services/product.ts');
  const article = read('./features/article/services/article.ts');
  const exhibition = read('./features/exhibition/services/exhibition.ts');

  assert.match(product, /export interface LinkedProductItem/);
  assert.match(article, /linkedProducts\?: LinkedProductItem\[\]/);
  assert.match(article, /\/api\/articles\/\$\{id\}\/products/);
  assert.match(exhibition, /linkedProducts\?: LinkedProductItem\[\]/);
  assert.match(exhibition, /\/api\/exhibitions\/\$\{id\}\/products/);
});

test('article and exhibition admin pages provide separate product linking controls', () => {
  const article = read('./features/article/views/admin/ArticleManagementPage.vue');
  const exhibition = read('./features/exhibition/views/admin/ExhibitionManagementPage.vue');

  for (const source of [article, exhibition]) {
    assert.match(source, /fetchProducts/);
    assert.match(source, /productLinkId/);
    assert.match(source, /attachProduct/);
    assert.match(source, /detachProduct/);
    assert.match(source, /挂接文创产品/);
    assert.match(source, /已挂接文创产品/);

    // 挂接选择器必须走用户端目录：backstage=true 在传承人身上等于"只看自己的文创"，
    // 会让传承人无法挂接他人已上架的文创。
    const loadProducts = source
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n')
      .match(/async function loadProducts\(\)[\s\S]*?\n\}/)?.[0] ?? '';
    assert.match(loadProducts, /fetchProducts\(\{[^}]*status: 'APPROVED'/);
    assert.doesNotMatch(loadProducts, /backstage/);
  }
});

test('node link pickers never re-offer an already linked node', () => {
  const article = read('./features/article/views/admin/ArticleManagementPage.vue');
  const exhibition = read('./features/exhibition/views/admin/ExhibitionManagementPage.vue');

  for (const source of [article, exhibition]) {
    assert.match(source, /const linkableNodeOptions = computed\(/);
    // 挂接面板的下拉只能消费已排除已挂接节点的候选集，
    // 否则会命中后端唯一键返回 409 Conflict。
    assert.match(source, /<option v-for="node in linkableNodeOptions"/);
    const rawOptionUses = source.match(/<option v-for="node in nodeOptions"/g) ?? [];
    // 文章编辑弹窗的「关联节点」仍需要全量候选，因此允许存在 1 处；挂接面板不得出现。
    assert.ok(rawOptionUses.length <= 1, `${rawOptionUses.length} raw nodeOptions dropdowns found`);
    assert.match(source, /<small v-if="nodeOptions\.length > 0 && linkableNodeOptions\.length === 0">/);
  }
});

test('duplicate node link conflicts are translated into actionable copy', () => {
  const errors = read('./services/apiErrors.ts');

  assert.match(errors, /'Node is already linked to this article': '/);
  assert.match(errors, /'Node is already linked to this exhibition': '/);
});

test('portal detail pages link approved products to purchasable product detail pages', () => {
  const article = read('./features/article/views/portal/ArticleDetailPage.vue');
  const exhibition = read('./features/exhibition/views/portal/ExhibitionDetailPage.vue');

  for (const source of [article, exhibition]) {
    assert.match(source, /approvedProducts/);
    assert.match(source, /status === 'APPROVED'/);
    assert.match(source, /router\.push\(`\/products\/\$\{product\.productId\}`\)/);
    assert.match(source, /选购文创产品/);
    assert.match(source, /router\.push\(`\/heritage\/\$\{node\.nodeId\}`\)/);
  }
});
