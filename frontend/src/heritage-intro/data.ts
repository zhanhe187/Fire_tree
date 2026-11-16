export type PageKey = 'home' | 'explore' | 'graph' | 'community' | 'favorites';

export type RegionItem = {
  region: string;
  code: string;
  project: string;
  category: string;
  level: string;
  intro: string;
  tags: string[];
};

export type ProjectItem = {
  region: string;
  category: string;
  title: string;
  description: string;
  image: string;
  alt: string;
};

export const navItems: Array<{ key: PageKey; label: string; path: string }> = [
  { key: 'home', label: '首页', path: '/' },
  { key: 'explore', label: '浏览', path: '/explore' },
  { key: 'graph', label: '图谱', path: '/graph' },
  { key: 'community', label: '社区问答', path: '/community' },
  { key: 'favorites', label: '收藏学习', path: '/favorites' },
];

/** 湖南非遗视觉素材（frontend/public 下的类别封面，随构建一起分发） */
const covers = {
  embroidery: '/heritage-media/embroidery-cover.jpg',
  porcelain: '/heritage-media/porcelain-cover.jpg',
  dragonBoat: '/heritage-media/dragon-boat-cover.jpg',
  region: '/heritage-media/region-cover.jpg',
  opera: '/heritage-media/opera-kunqu-cover.jpg',
  folkLiterature: '/heritage-media/folk-literature-cover.jpg',
  solarTerms: '/heritage-media/solar-terms-cover.jpg',
  lionDance: '/heritage-media/lion-dance-cover.jpg',
};

export const swapCards = [
  { image: covers.embroidery, alt: '湘绣非遗主题图片', tag: '重点推荐', title: '湘绣', desc: '掺针毛针 · 湖湘针法', dark: false },
  { image: covers.dragonBoat, alt: '汨罗江畔端午习俗图片', tag: '民俗节庆', title: '汨罗端午', desc: '雕龙朝庙 · 龙舟竞渡', dark: false },
  { image: covers.porcelain, alt: '醴陵釉下五彩瓷图片', tag: '传统技艺', title: '醴陵釉下五彩瓷', desc: '釉下分水 · 高温一次烧成', dark: true },
  { image: covers.region, alt: '土家族织锦技艺图片', tag: '传统技艺', title: '土家族织锦', desc: '通经断纬 · 四百种纹样', dark: false },
];

export const projectItems: ProjectItem[] = [
  { region: '长沙', category: '传统美术', title: '湘绣', image: covers.embroidery, alt: '湘绣图片', description: '湘绣以“掺针”表现色阶渐变，配合极细的劈丝技术再现笔墨韵味，已形成五大类 72 种针法体系，双面全异绣被誉为“超级绣品”。' },
  { region: '岳阳', category: '民俗', title: '汨罗江畔端午习俗', image: covers.dragonBoat, alt: '汨罗江畔端午习俗图片', description: '汨罗江畔端午从五月初一持续到十五，除吃粽子、插艾挂菖、赛龙舟外，还有雕龙头、朝庙、祭龙与祭祀屈原等特殊风俗，2009 年随“端午节”列入人类非遗代表作名录。' },
  { region: '株洲', category: '传统技艺', title: '醴陵釉下五彩瓷', image: covers.porcelain, alt: '醴陵釉下五彩瓷图片', description: '从原料到成品近一百道工序全部手工完成，双勾分水填色后以 1350℃—1410℃高温一次烧成，釉面莹润光洁，被誉为“东方陶瓷艺术高峰”。' },
  { region: '湘西州', category: '传统技艺', title: '土家族织锦技艺', image: covers.region, alt: '土家族织锦技艺图片', description: '土家语称“西兰卡普”，用纯木质腰式斜织机经十二道工序、以“反织法”挑织图案，四百多种传统纹样承载着酉水流域土家人的文化记忆。' },
];

export const regionCategories = [
  '全部',
  '民间文学',
  '传统音乐',
  '传统舞蹈',
  '传统戏剧',
  '曲艺',
  '传统体育、游艺与杂技',
  '传统美术',
  '传统技艺',
  '民俗',
];

/** 湖南 14 个市州与各自的代表性非遗项目（资料取自中国非物质文化遗产网等公开渠道） */
export const heritageRegions: RegionItem[] = [
  { region: '长沙', code: 'CS', project: '湘绣', category: '传统美术', level: '国家级非遗', intro: '以掺针、毛针与双面全异绣著称，纱坪一带的绣庄与马王堆汉墓绣品共同构成两千余年的湖湘刺绣脉络。', tags: ['刺绣', '湖湘', '掺针'] },
  { region: '株洲', code: 'ZZ', project: '醴陵釉下五彩瓷烧制技艺', category: '传统技艺', level: '国家级非遗', intro: '釉下彩绘、双勾分水填色后高温一次烧成，画面莹润光洁，曾获巴拿马太平洋万国博览会金牌奖。', tags: ['瓷器', '釉下彩', '醴陵'] },
  { region: '湘潭', code: 'XT', project: '青山唢呐', category: '传统音乐', level: '国家级非遗', intro: '流传于湘潭县青山桥一带的吹打乐，曲牌分夜鼓牌子、路鼓牌子与堂牌子，衡湘四县旧称“青山桥国乐”。', tags: ['唢呐', '吹打乐', '民俗'] },
  { region: '衡阳', code: 'HY', project: '花鼓戏（衡州花鼓戏）', category: '传统戏剧', level: '国家级非遗', intro: '明末清初流行于湘南的民间小戏，以唢呐牌子与川子调为声腔，以小生、小旦、小丑三小行为主。', tags: ['花鼓', '湘南', '小戏'] },
  { region: '邵阳', code: 'SY', project: '滩头木版年画', category: '传统美术', level: '国家级非遗', intro: '湖南省唯一的手工木版水印年画，从手工抄纸到印制全流程都在滩头镇完成，“陡刀立线”制版技法尤为著名。', tags: ['年画', '木版', '滩头'] },
  { region: '岳阳', code: 'YY', project: '端午节（汨罗江畔端午习俗）', category: '民俗', level: '人类非遗代表作', intro: '自五月初一至十五的端午习俗体系，含雕龙头、偷神木、龙舟下水、朝庙、祭龙与祭祀屈原等仪程。', tags: ['端午', '汨罗', '龙舟'] },
  { region: '常德', code: 'CD', project: '常德丝弦', category: '曲艺', level: '国家级非遗', intro: '由江浙时调小曲与湖南民歌曲调融合发展而成的曲艺，用扬琴、琵琶、月琴等丝弦乐器伴奏，唱腔分牌子丝弦与板子丝弦。', tags: ['丝弦', '曲艺', '常德'] },
  { region: '张家界', code: 'ZJJ', project: '桑植民歌', category: '传统音乐', level: '国家级非遗', intro: '分山歌、小调、礼仪歌、傩腔等体裁，三句体歌词结构与特殊润腔方法为研究中国民歌多样性提供了珍贵资料。', tags: ['民歌', '桑植', '润腔'] },
  { region: '益阳', code: 'YY2', project: '黑茶制作技艺（千两茶制作技艺）', category: '传统技艺', level: '人类非遗代表作', intro: '安化千两茶以篾篓踩压成型、日晒夜露 55 天成茶，全程手工操作，2022 年随“中国传统制茶技艺及其相关习俗”列入人类非遗代表作名录。', tags: ['黑茶', '安化', '千两茶'] },
  { region: '郴州', code: 'CZ', project: '昆曲（湘昆）', category: '传统戏剧', level: '人类非遗代表作', intro: '明代中期昆曲传入郴州形成湘昆，水磨腔纯细婉转、载歌载舞，湖南省昆剧团是全国八大昆剧院团之一。', tags: ['湘昆', '昆曲', '郴州'] },
  { region: '永州', code: 'YZ', project: '女书习俗', category: '民俗', level: '国家级非遗', intro: '江永上江圩一带妇女专用的长菱形文字，仅四百多个字符便能写出千余字七字韵文，是目前世界上唯一的女性专用文字。', tags: ['女书', '江永', '女性文字'] },
  { region: '怀化', code: 'HH', project: '侗锦织造技艺', category: '传统技艺', level: '国家级非遗', intro: '通道侗族手工织锦，分素锦与彩锦，需经轧棉、纺纱、染纱、绞经、排经、织锦等工序，图案承载侗族的信仰与生活。', tags: ['侗锦', '通道', '织造'] },
  { region: '娄底', code: 'LD', project: '梅山武术', category: '传统体育、游艺与杂技', level: '国家级非遗', intro: '以防为主、攻防兼备的梅山武术流派，拳术、器械、功法三大类，齐眉棍、板凳、铁尺为特有器械。', tags: ['梅山', '武术', '新化'] },
  { region: '湘西州', code: 'XX', project: '土家族织锦技艺', category: '传统技艺', level: '国家级非遗', intro: '土家语称“西兰卡普”，通经断纬挖花、反织法挑织，四百多种传统纹样是酉水流域土家人的文化积淀。', tags: ['西兰卡普', '织锦', '龙山'] },
];

export const palette = ['#d83a2e', '#f4b43f', '#22a76d', '#1e9cff', '#8c63ff', '#f06d3a'];
export const introImages = { heroDramaUrl: covers.opera, bianlianUrl: covers.embroidery };
