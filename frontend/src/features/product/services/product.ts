import { request, send, sendForm } from '../../../services/http';

export type ProductStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'OFFLINE';

export interface LinkedProductItem {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  description?: string;
  coverUrl?: string;
  price?: number;
  stock?: number;
  status: ProductStatus;
  createdAt?: string;
}

export interface ProductReviewItem {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  content?: string;
  replyContent?: string;
  status: 'PENDING' | 'PUBLISHED' | 'HIDDEN';
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductItem {
  id: number;
  productCode: string;
  name: string;
  description?: string;
  coverFileId?: number;
  coverUrl?: string;
  relatedNodeId?: number;
  relatedNodeCode?: string;
  relatedNodeName?: string;
  ownerUserId?: number;
  ownerUsername?: string;
  ownerName?: string;
  externalUrl?: string;
  price?: number;
  stock?: number;
  averageRating: number;
  ratingCount: number;
  status: ProductStatus;
  createdAt?: string;
  updatedAt?: string;
  reviews?: ProductReviewItem[];
}

export interface ProductListResponse {
  page: number;
  size: number;
  total: number;
  items: ProductItem[];
}

export interface ProductPayload {
  productCode?: string;
  name?: string;
  description?: string;
  coverFileId?: number | null;
  relatedNodeId?: number | null;
  ownerUserId?: number | null;
  ownerUsername?: string | null;
  externalUrl?: string;
  price?: number | null;
  stock?: number | null;
  status?: ProductStatus;
}

export interface ProductReviewPayload {
  rating?: number;
  content?: string;
}

export interface ProductPurchasePayload {
  quantity?: number;
  address?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface ProductPurchaseResult {
  orderNo: string;
  productId: number;
  quantity: number;
  total: number;
  status: string;
  /** true 表示命中了 Idempotency-Key，未重复下单 */
  reused?: boolean;
}

export type ProductOrderStatus = 'PAID' | 'SHIPPED' | 'COMPLETED' | 'REFUNDED' | 'CANCELLED';

export type ProductOrderDirection = 'ALL' | 'BUYING' | 'SELLING';

export interface ProductOrderItem {
  id: number;
  orderNo: string;
  buyerId: number;
  buyerUsername?: string;
  buyerName?: string;
  sellerId: number;
  sellerUsername?: string;
  sellerName?: string;
  isBuyer?: boolean;
  isSeller?: boolean;
  productId: number;
  productName?: string;
  productCoverUrl?: string;
  quantity: number;
  unitPrice?: number;
  total: number;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  status: ProductOrderStatus;
  createdAt?: string;
  /** 最近一次状态变更时间；从未变更过时等于下单时间 */
  updatedAt?: string;
}

export interface ProductOrderListResponse {
  page: number;
  size: number;
  total: number;
  direction?: ProductOrderDirection;
  /** 各状态订单数（不受 status 过滤影响） */
  summary?: Record<string, number>;
  items: ProductOrderItem[];
}

export function fetchProducts(params: {
  keyword?: string;
  relatedNodeId?: number | '';
  status?: string;
  sort?: string;
  backstage?: boolean;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.relatedNodeId) search.set('relatedNodeId', String(params.relatedNodeId));
  if (params.status) search.set('status', params.status);
  if (params.sort) search.set('sort', params.sort);
  if (params.backstage) search.set('backstage', 'true');
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 10));
  return request<ProductListResponse>(`/api/products?${search.toString()}`);
}

export function fetchProduct(id: number, options: { backstage?: boolean } = {}) {
  const search = new URLSearchParams();
  if (options.backstage) search.set('backstage', 'true');
  const suffix = search.size ? `?${search.toString()}` : '';
  return request<ProductItem>(`/api/products/${id}${suffix}`);
}

export function createProduct(payload: ProductPayload) {
  return send<ProductItem>('/api/products', 'POST', payload);
}

export function updateProduct(id: number, payload: ProductPayload) {
  return send<ProductItem>(`/api/products/${id}`, 'PUT', payload);
}

export function deleteProduct(id: number) {
  return send<void>(`/api/products/${id}`, 'DELETE');
}

export function createProductReview(id: number, payload: ProductReviewPayload) {
  return send<ProductReviewItem>(`/api/products/${id}/reviews`, 'POST', payload);
}

export function purchaseProduct(id: number, payload: ProductPurchasePayload, idempotencyKey?: string) {
  return send<ProductPurchaseResult>(`/api/products/${id}/purchase`, 'POST', payload, idempotencyKey
    ? { headers: { 'Idempotency-Key': idempotencyKey } }
    : undefined);
}

export function fetchProductOrders(params: {
  buyerId?: number;
  productId?: number;
  keyword?: string;
  status?: ProductOrderItem['status'] | '';
  direction?: ProductOrderDirection;
  page?: number;
  size?: number;
}) {
  const search = new URLSearchParams();
  if (params.buyerId) search.set('buyerId', String(params.buyerId));
  if (params.productId) search.set('productId', String(params.productId));
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.status) search.set('status', params.status);
  if (params.direction) search.set('direction', params.direction);
  search.set('page', String(params.page ?? 1));
  search.set('size', String(params.size ?? 20));
  return request<ProductOrderListResponse>(`/api/products/purchase-orders?${search.toString()}`);
}

export function updateProductOrderStatus(logId: number, status: ProductOrderItem['status']) {
  return send<void>(`/api/products/purchase-orders/${logId}/status`, 'PUT', { status });
}

/** 买家自助取消：仅对尚未发货（PAID）的自己买入的订单有效，后端会原子归还库存。 */
export function cancelProductOrder(logId: number) {
  return updateProductOrderStatus(logId, 'CANCELLED');
}
