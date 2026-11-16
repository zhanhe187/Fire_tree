import { GraphNodeItem } from '../features/graph/services/graph';

type HeritageDisplaySource = Partial<GraphNodeItem>;
export type HeritageImageStatus = 'REAL_PROJECT_IMAGE' | 'CATEGORY_FALLBACK' | 'NO_IMAGE';

type DisplayPatch = {
  category: string;
  level: string;
  summary: string;
  image?: string;
  caption?: string;
};

/** 湖南相关的人类非遗代表作名录条目（frontend/public 下的类别封面） */
const officialImages = {
  kunqu: '/heritage-media/opera-kunqu-cover.jpg',
  dragonBoat: '/heritage-media/dragon-boat-cover.jpg',
  shadowPuppet: '/heritage-media/opera-kunqu-cover.jpg',
  solarTerms: '/heritage-media/solar-terms-cover.jpg',
  tea: '/heritage-media/region-cover.jpg',
};

const unescoPatches: Record<string, DisplayPatch> = {
  hunan_unesco_kunqu: {
    category: '传统戏剧',
    level: '人类非物质文化遗产代表作名录',
    summary: '昆曲是中国现存最古老的戏曲声腔之一，2001 年列入联合国教科文组织人类非物质文化遗产代表作名录；明代中期传入郴州形成湘昆，湖南省昆剧团是全国八大昆剧院团之一。',
    image: officialImages.kunqu,
    caption: '湘昆舞台表演展示图',
  },
  hunan_unesco_duanwu: {
    category: '民俗',
    level: '人类非物质文化遗产代表作名录',
    summary: '端午节以纪念先贤、赛龙舟、食粽、悬艾草和佩香囊等习俗构成复合节日传统；湖南汨罗江畔端午习俗含雕龙头、朝庙、祭龙等仪程，2009 年作为“端午节”组成部分列入人类非遗代表作名录。',
    image: officialImages.dragonBoat,
    caption: '汨罗江畔端午龙舟展示图',
  },
  hunan_unesco_piying: {
    category: '传统戏剧',
    level: '人类非物质文化遗产代表作名录',
    summary: '中国皮影戏 2011 年列入人类非物质文化遗产代表作名录；湖南皮影戏影人多用纸偶，吸收剪纸、绘画与雕刻技法，衡山县是重要流布地，当地俗称“衡山影子戏”。',
    image: officialImages.shadowPuppet,
    caption: '湖南皮影戏展示图',
  },
  hunan_unesco_jieqi: {
    category: '民俗',
    level: '人类非物质文化遗产代表作名录',
    summary: '二十四节气是中国人观察太阳周年运动形成的时间知识体系，2016 年列入人类非遗代表作名录；湘西花垣苗族赶秋与郴州安仁赶分社都是其组成部分。',
    image: officialImages.solarTerms,
    caption: '二十四节气非遗展示图',
  },
  hunan_unesco_chazhi: {
    category: '传统技艺',
    level: '人类非物质文化遗产代表作名录',
    summary: '中国传统制茶技艺及其相关习俗 2022 年列入人类非遗代表作名录；湖南入列项目包括安化千两茶、益阳茯砖茶与岳阳君山银针茶制作技艺。',
    image: officialImages.tea,
    caption: '湖南黑茶制作技艺展示图',
  },
};

function normalizeNodeType(value?: string) {
  if (!value) return '非遗项目';
  if (value === 'UNESCO名录项目') return '联合国教科文组织名录项目';
  return value;
}

function hasLegacyPlaceholder(text?: string) {
  return Boolean(text && (text.includes('UNESCO 非物质文化遗产代表作名录中的中国相关项目') || text.includes('本种子仅保存名录元数据')));
}

function categoryFallback(item: HeritageDisplaySource) {
  const code = item.nodeCode || '';
  const typeName = normalizeNodeType(item.nodeTypeName);
  if (code.startsWith('hunan_project_') || code.startsWith('ihchina_project_')) return item.category || '民间文学';
  if (code.startsWith('hunan_inheritor_') || code.startsWith('ihchina_inheritor_')) return item.category || '传承人';
  if (code.startsWith('hunan_region_') || code.startsWith('ihchina_region_')) return '地区';
  return normalizeNodeType(item.category || typeName);
}

function normalizeImageUrl(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

export function getHeritageDisplay(item: HeritageDisplaySource) {
  const patch = item.nodeCode ? unescoPatches[item.nodeCode] : undefined;
  const category = patch?.category || categoryFallback(item);
  const nodeTypeName = normalizeNodeType(item.nodeTypeName);
  const projectLevel = item.projectLevel || patch?.level || nodeTypeName;
  const fallbackSummary = '该项目已收录于公开非遗数据库，点击查看中文详情、来源和图谱信息。';
  const adminSummary = item.summary && !hasLegacyPlaceholder(item.summary) ? item.summary : undefined;
  const adminContent = item.content && !hasLegacyPlaceholder(item.content) ? item.content : undefined;
  const summary = adminSummary || patch?.summary || fallbackSummary;
  const content = adminContent || adminSummary || patch?.summary || fallbackSummary;
  const realImageUrl = normalizeImageUrl(item.coverImageUrl) || normalizeImageUrl(patch?.image);
  // 资料补全/媒体档案上传的图片同样属于"真实图片"，不应当被当成类别示意图。
  const isUploadedImage = Boolean(realImageUrl && realImageUrl.startsWith('/uploads/media/'));
  const imageStatus: HeritageImageStatus = !realImageUrl
    ? 'NO_IMAGE'
    : realImageUrl.startsWith('/heritage-media/hunan-project/') || isUploadedImage
      ? 'REAL_PROJECT_IMAGE'
      : 'CATEGORY_FALLBACK';
  const hasCoverImage = Boolean(realImageUrl);
  const coverImageCaption = imageStatus === 'NO_IMAGE'
    ? '未有图像信息'
    : item.coverImageCaption
      || patch?.caption
      || `${item.name || category}${imageStatus === 'REAL_PROJECT_IMAGE' ? '项目图' : '类别示意图'}`;
  const missingFields = [
    ...(hasCoverImage ? [] : ['图像信息']),
    ...(item.coverImageCaption || patch?.caption ? [] : ['图像说明']),
  ];
  let sourceName = item.sourceName;
  if (sourceName === 'UNESCO Intangible Cultural Heritage Lists·China elements') {
    sourceName = '联合国教科文组织·中国非物质文化遗产名录项目';
  }

  return {
    category,
    nodeTypeName,
    projectLevel,
    summary,
    content,
    imageStatus,
    coverImageUrl: realImageUrl,
    coverImageCaption,
    hasCoverImage,
    missingFields,
    sourceName,
  };
}
