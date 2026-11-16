import type { Component } from 'vue';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CalendarCheck,
  CircleDot,
  FileCheck2,
  GitBranch,
  Heart,
  Landmark,
  MessageCircleQuestion,
  PackageCheck,
  ShieldCheck,
  UsersRound,
} from 'lucide-vue-next';
import type { AdminGraphTab, AdminViewKey } from './adminNavigation';

export interface AdminDashboardModule {
  name: string;
  detail: string;
  icon: Component;
  accent: 'red' | 'gold' | 'jade' | 'blue';
  view: AdminViewKey;
  tab?: AdminGraphTab;
  routeOverride?: string;
}

export const adminDashboardModules: AdminDashboardModule[] = [
  { name: '图谱实体', detail: '节点分类、实体档案、标签筛选', icon: CircleDot, accent: 'red', view: 'graph', tab: 'nodes' },
  { name: '关系建模', detail: '师承、发源、作品、材料关系', icon: GitBranch, accent: 'gold', view: 'graph', tab: 'edges' },
  { name: '风险推理', detail: '传承断点扫描、报告处理、风险闭环', icon: AlertTriangle, accent: 'red', view: 'risk' },
  { name: '多媒体档案', detail: '图片、音视频、文档元数据与节点挂接', icon: Boxes, accent: 'jade', view: 'media' },
  { name: '申报审核', detail: '材料提交、状态流转、审核日志', icon: FileCheck2, accent: 'jade', view: 'applications' },
  { name: '敏感词审核', detail: '敏感词维护、命中记录、后台日志', icon: ShieldCheck, accent: 'gold', view: 'governance' },
  { name: '社区问答', detail: '节点提问、传承人回答、评论点赞', icon: MessageCircleQuestion, accent: 'blue', view: 'community' },
  { name: '学习档案', detail: '在学节点、私人笔记、收藏关系图', icon: Heart, accent: 'red', view: 'favorites' },
  { name: '学习打卡', detail: '每日推荐、学习日历、热门节点榜', icon: CalendarCheck, accent: 'jade', view: 'learning' },
  { name: '文创评价', detail: '产品挂接、评分排序、合规审核', icon: PackageCheck, accent: 'gold', view: 'products' },
  { name: '订单管理', detail: '文创购买订单查询、发货与退款', icon: PackageCheck, accent: 'gold', view: 'products', routeOverride: '/admin/content/product-orders' },
  { name: '资讯运营', detail: '文章发布、分类筛选、发布下线', icon: FileCheck2, accent: 'blue', view: 'articles' },
  { name: '展览市集', detail: '展览编辑、节点挂接、图谱关联', icon: Landmark, accent: 'jade', view: 'exhibitions' },
  { name: '账号密码管理', detail: '全部用户、启停状态、密码重置', icon: UsersRound, accent: 'blue', view: 'users' },
  { name: '大屏地图', detail: '类别占比、年龄柱状、省份热力、传播轨迹', icon: BarChart3, accent: 'blue', view: 'analytics' },
];

export const previewTypeDescriptions: Record<string, string> = {
  heritage_project: '记录非遗项目的名称、级别、保护单位与流布脉络，是连接传承人、作品、地区和申报材料的核心节点。',
  inheritor: '呈现代表性传承人的师承关系、技艺专长、代表作品与传承活动，用于追踪活态传承链路。',
  region: '承载项目申报地、流布区域与文化生态信息，帮助观察非遗资源在地域之间的分布与关联。',
  work: '沉淀代表作品、演出剧目、工艺成果与数字化素材，方便从成果反查技艺、传承人与材料。',
  craft_material: '描述工艺原料、工具、纹样和技法要素，支撑从材料到技艺流程的知识溯源。',
  historical_period: '关联历史时期、发展阶段和重要事件，帮助还原非遗项目的时间脉络。',
  exhibition_market: '记录展览、市集、传播活动和文旅场景，观察非遗从保护到转化传播的路径。',
  cultural_product: '管理文创产品、授权信息、评价与合规状态，连接非遗资源和现代消费场景。',
};

export function adminTopbarEyebrow(view: AdminViewKey, isSuperAdmin: boolean, routePath: string) {
  if (view === 'dashboard') return '非遗文化知识图谱系统';
  if (view === 'applications') return isSuperAdmin ? '非遗数字化申报' : '非遗项目申报';
  if (view === 'governance') return '内容治理中心';
  if (view === 'community') return '非遗社区共创';
  if (view === 'favorites') return '用户学习运营';
  if (view === 'learning') return '非遗学习运营';
  if (view === 'products') return routePath === '/admin/content/product-orders' ? '文创订单管理' : '文创转化运营';
  if (view === 'articles') return '资讯与内容运营';
  if (view === 'exhibitions') return '展览与市集运营';
  if (view === 'users') return '系统账号管理';
  if (view === 'analytics') return '时空可视化大屏';
  if (view === 'risk') return '传承风险推理';
  if (view === 'media') return '多媒体档案';
  return '知识图谱管理';
}

export function adminTopbarTitle(view: AdminViewKey, isSuperAdmin: boolean, routePath: string) {
  if (view === 'dashboard') return '运营与图谱构建工作台';
  if (view === 'applications') return isSuperAdmin ? '申报审核工作台' : '项目申报工作台';
  if (view === 'governance') return '敏感词与审计中心';
  if (view === 'community') return '社区问答工作台';
  if (view === 'favorites') return '学习档案';
  if (view === 'learning') return '学习打卡工作台';
  if (view === 'products') return routePath === '/admin/content/product-orders' ? '文创购买订单管理' : '文创评价工作台';
  if (view === 'articles') return '资讯运营工作台';
  if (view === 'exhibitions') return '展览市集工作台';
  if (view === 'users') return '全部用户账号密码管理';
  if (view === 'analytics') return '数据大屏与地图';
  if (view === 'risk') return '传承风险报告';
  if (view === 'media') return '多媒体档案管理';
  return '知识图谱管理';
}
