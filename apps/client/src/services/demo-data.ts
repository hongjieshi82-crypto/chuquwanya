import { Image as NativeImage } from 'react-native';

import type {
  Activity,
  City,
  DrawRequest,
  DrawResult,
  GuestUser,
  PreferenceOptions,
} from '@/types';
import type { Attraction, Destination, TravelTag } from '@/types/travel';

type StaticAsset = number | string | { uri: string };

const westLakeImage = require('../../assets/images/pc-hero-west-lake.jpg') as StaticAsset;
function bundledTravelImage(fileName: string) {
  const configuredBasePath = process.env.EXPO_GITHUB_PAGES_BASE_URL ?? '';
  if (typeof window === 'undefined') return `${configuredBasePath}/media/travel/${fileName}`;
  const runtimePagesBasePath = window.location.hostname.endsWith('github.io')
    ? `/${window.location.pathname.split('/').filter(Boolean)[0] ?? ''}`
    : '';
  const basePath = configuredBasePath || runtimePagesBasePath;
  return `${basePath}/media/travel/${fileName}`;
}

// 旅行图片随前端同源发布，避免手机端依赖 GitHub Raw / Wikimedia 跳转。
const beijingImage = bundledTravelImage('beijing.jpg');
const shanghaiImage = bundledTravelImage('shanghai.jpg');
const hangzhouImage = bundledTravelImage('hangzhou.jpg');
const shenzhenImage = bundledTravelImage('shenzhen.jpg');
const tianjinImage = bundledTravelImage('tianjin.jpg');
const yantaiImage = bundledTravelImage('yantai.jpg');
const beijingOlympicForestImage = bundledTravelImage('beijing-olympic-forest.jpg');
const shenzhenLianhuashanImage = bundledTravelImage('shenzhen-lianhuashan.jpg');
const tianjinFiveAvenuesImage = bundledTravelImage('tianjin-five-avenues.jpg');
const qingdaoImage = bundledTravelImage('qingdao.jpg');
const nanjingImage = bundledTravelImage('nanjing.jpg');
const wuhanImage = bundledTravelImage('wuhan.jpg');
const chengduImage = bundledTravelImage('chengdu.jpg');
const xianImage = bundledTravelImage('xian.jpg');
const changshaImage = bundledTravelImage('changsha.jpg');
const guangzhouImage = bundledTravelImage('guangzhou.jpg');
const hefeiImage = bundledTravelImage('hefei.jpg');
const chongqingImage = bundledTravelImage('chongqing.jpg');
const xiamenImage = bundledTravelImage('xiamen.jpg');
const jinanImage = bundledTravelImage('jinan.jpg');
const kunmingImage = bundledTravelImage('kunming.jpg');

export const demoCityImageUris = {
  beijing: beijingImage,
  shanghai: shanghaiImage,
  hangzhou: hangzhouImage,
  shenzhen: shenzhenImage,
  tianjin: tianjinImage,
  yantai: yantaiImage,
  qingdao: qingdaoImage,
  nanjing: nanjingImage,
  wuhan: wuhanImage,
  chengdu: chengduImage,
  xian: xianImage,
  changsha: changshaImage,
  guangzhou: guangzhouImage,
  hefei: hefeiImage,
  chongqing: chongqingImage,
  xiamen: xiamenImage,
  jinan: jinanImage,
  kunming: kunmingImage,
} as const;

export const demoPlaceImageUris = {
  beijingOlympicForest: beijingOlympicForestImage,
  shenzhenLianhuashan: shenzhenLianhuashanImage,
  tianjinFiveAvenues: tianjinFiveAvenuesImage,
} as const;

function assetUri(source: StaticAsset) {
  if (typeof source === 'string') return source;
  if (typeof source === 'object' && source.uri) return source.uri;
  if (typeof source !== 'number') return '';

  const resolveAssetSource = NativeImage.resolveAssetSource as
    | ((asset: number) => { uri?: string } | undefined)
    | undefined;
  return resolveAssetSource?.(source)?.uri ?? '';
}

export const demoCities: City[] = [
  { id: 1, name: '北京', code: 'beijing', province: '北京' },
  { id: 2, name: '上海', code: 'shanghai', province: '上海' },
  { id: 3, name: '杭州', code: 'hangzhou', province: '浙江' },
  { id: 4, name: '深圳', code: 'shenzhen', province: '广东' },
  { id: 5, name: '天津', code: 'tianjin', province: '天津' },
  { id: 6, name: '烟台', code: 'yantai', province: '山东' },
  { id: 7, name: '青岛', code: 'qingdao', province: '山东' },
  { id: 8, name: '南京', code: 'nanjing', province: '江苏' },
  { id: 9, name: '武汉', code: 'wuhan', province: '湖北' },
  { id: 10, name: '成都', code: 'chengdu', province: '四川' },
  { id: 11, name: '西安', code: 'xian', province: '陕西' },
  { id: 12, name: '长沙', code: 'changsha', province: '湖南' },
  { id: 13, name: '广州', code: 'guangzhou', province: '广东' },
  { id: 14, name: '合肥', code: 'hefei', province: '安徽' },
  { id: 15, name: '重庆', code: 'chongqing', province: '重庆' },
  { id: 16, name: '厦门', code: 'xiamen', province: '福建' },
  { id: 17, name: '济南', code: 'jinan', province: '山东' },
  { id: 18, name: '昆明', code: 'kunming', province: '云南' },
];

export const demoPreferenceOptions: PreferenceOptions = {
  partySizes: [1, 2, 3, 4].map((value) => ({ label: `${value} 人`, value })),
  durations: [60, 120, 240, 480].map((value) => ({
    label: value < 60 ? `${value} 分钟` : `${value / 60} 小时`,
    value,
  })),
  budgets: [
    { label: '0-50 元', value: 50 },
    { label: '50-100 元', value: 100 },
    { label: '100 元以上', value: null },
  ],
  moods: ['放松', '探索', '热闹'],
  categories: ['不限', '风景人文', '城市漫游', '寻味探购', '户外探索'],
  environments: [
    { label: '不限', value: 'either' },
    { label: '室内', value: 'indoor' },
    { label: '户外', value: 'outdoor' },
  ],
  radiuses: [
    { label: '全城', value: null },
    { label: '3 公里', value: 3 },
    { label: '10 公里', value: 10 },
  ],
};

const destinationImages = [
  beijingImage, shanghaiImage, hangzhouImage, shenzhenImage, tianjinImage, yantaiImage,
  qingdaoImage, nanjingImage, wuhanImage, chengduImage, xianImage, changshaImage,
  guangzhouImage, hefeiImage, chongqingImage, xiamenImage, jinanImage, kunmingImage,
];

export const demoDestinations: Destination[] = demoCities.map((city, index) => ({
  id: city.id,
  cityId: city.id,
  name: city.name,
  province: city.province,
  summary: [
    '古都轴线与公园绿意交织，适合一场不赶路的城市探索。',
    '从街区漫游到滨江日落，把熟悉的城市换一种打开方式。',
    '湖山、茶园与老街相连，慢慢走就能遇见好风景。',
    '山海公园与年轻街区同框，适合随时出发的小冒险。',
    '在洋楼、海河与旧街之间，收集一组城市建筑色卡。',
    '沿着海岸线吹风看浪，把周末调成轻松模式。',
    '红瓦、海岸与山色相连，适合用半天收集一组海城画面。',
    '梧桐、城墙与秦淮夜色交织，慢走也能读到城市层次。',
    '江湖相逢，大学与老街并置，适合骑行和夜间漫游。',
    '在公园、茶馆与街巷之间，体验一座松弛又有活力的城市。',
    '城墙、博物馆与夜景相连，用一步一景打开古都。',
    '山水洲城与街头烟火同框，适合热闹又轻松的周末。',
    '从西关骑楼到珠江夜色，感受岭南生活和创新活力。',
    '湖景、科创园区与城市新中心相连，适合一场未来感漫游。',
    '山城步道、江景与立体交通，让每次转弯都有新视角。',
    '海风、骑楼与岛屿生活并置，适合不赶时间的慢旅行。',
    '泉水、老城和湖岸串成一条清凉路线，四季都适合散步。',
    '高原阳光、翠湖与花市交织，把周末过成温柔的慢镜头。',
  ][index],
  coverImageUri: assetUri(destinationImages[index]),
  rating: [4.8, 4.9, 4.9, 4.8, 4.7, 4.8, 4.8, 4.8, 4.8, 4.9, 4.9, 4.8, 4.8, 4.7, 4.9, 4.8, 4.7, 4.8][index],
  popularity: [96, 98, 97, 95, 92, 94, 95, 96, 96, 98, 98, 97, 97, 91, 99, 94, 90, 93][index],
  isHot: [0, 1, 2, 3, 6, 7, 8, 9, 10, 11, 14, 15].includes(index),
}));

export type DemoDestinationProfile = {
  category: string;
  tags: string[];
  bestSeason: string;
  difficulty: number;
  relaxation: number;
};

export const demoDestinationProfiles: Record<string, DemoDestinationProfile> = {
  北京: { category: '古都人文', tags: ['人文', '治愈', '5A景区', '秋日限定'], bestSeason: '春秋最佳', difficulty: 2, relaxation: 4 },
  上海: { category: '都市漫游', tags: ['美食', '人文', '松弛', '城市夜游'], bestSeason: '四季皆宜', difficulty: 2, relaxation: 4 },
  杭州: { category: '湖山治愈', tags: ['治愈', '松弛', '人文', '5A景区', '春日限定'], bestSeason: '春秋最佳', difficulty: 1, relaxation: 5 },
  深圳: { category: '山海轻户外', tags: ['轻户外', '海边', '亲子', '松弛'], bestSeason: '秋冬最佳', difficulty: 2, relaxation: 4 },
  天津: { category: '建筑人文', tags: ['人文', '美食', '松弛', '亲子'], bestSeason: '四季皆宜', difficulty: 1, relaxation: 4 },
  烟台: { category: '海岸治愈', tags: ['海边', '治愈', '轻户外', '亲子', '海岸秘境'], bestSeason: '夏秋最佳', difficulty: 2, relaxation: 5 },
  青岛: { category: '滨海人文', tags: ['海边', '人文', '美食', '轻户外', '崂山秘境', '5A景区'], bestSeason: '夏秋最佳', difficulty: 2, relaxation: 4 },
  南京: { category: '古都人文', tags: ['人文', '治愈', '5A景区', '秋日限定', '古镇'], bestSeason: '秋日限定', difficulty: 2, relaxation: 4 },
  武汉: { category: '江湖漫游', tags: ['轻户外', '人文', '美食', '亲子', '东湖秘境', '5A景区'], bestSeason: '春秋最佳', difficulty: 2, relaxation: 4 },
  成都: { category: '松弛美食', tags: ['松弛', '美食', '亲子', '人文', '古镇'], bestSeason: '四季皆宜', difficulty: 1, relaxation: 5 },
  西安: { category: '古都夜游', tags: ['人文', '美食', '5A景区', '亲子'], bestSeason: '春秋最佳', difficulty: 2, relaxation: 3 },
  长沙: { category: '烟火夜游', tags: ['美食', '人文', '松弛', '城市夜游'], bestSeason: '四季皆宜', difficulty: 2, relaxation: 4 },
  广州: { category: '岭南生活', tags: ['美食', '人文', '亲子', '松弛', '古镇'], bestSeason: '秋冬最佳', difficulty: 1, relaxation: 4 },
  合肥: { category: '科创湖岸', tags: ['轻户外', '亲子', '治愈', '巢湖秘境', 'AI之城'], bestSeason: '春秋最佳', difficulty: 1, relaxation: 4 },
  重庆: { category: '立体城市', tags: ['美食', '轻户外', '人文', '城市夜游', '山城秘境'], bestSeason: '秋冬最佳', difficulty: 3, relaxation: 3 },
  厦门: { category: '海岛松弛', tags: ['海边', '治愈', '亲子', '松弛', '季节限定'], bestSeason: '秋冬最佳', difficulty: 1, relaxation: 5 },
  济南: { category: '泉城人文', tags: ['治愈', '人文', '亲子', '5A景区', '古镇'], bestSeason: '春秋最佳', difficulty: 1, relaxation: 5 },
  昆明: { category: '高原慢游', tags: ['治愈', '松弛', '美食', '季节限定', '古镇', '花海秘境'], bestSeason: '春日限定', difficulty: 1, relaxation: 5 },
};

export const demoTravelTags: TravelTag[] = [
  { id: 1, name: '公园散步', category: 'scene' },
  { id: 2, name: '山海风景', category: 'scene' },
  { id: 3, name: '城市漫游', category: 'theme' },
  { id: 4, name: '轻户外', category: 'theme' },
  { id: 5, name: '双人约会', category: 'audience' },
  { id: 6, name: '朋友同行', category: 'audience' },
  { id: 7, name: '街巷寻味', category: 'food' },
  { id: 8, name: '咖啡探店', category: 'food' },
  { id: 9, name: '春日出发', category: 'season' },
  { id: 10, name: '夏夜散步', category: 'season' },
  { id: 11, name: '随机任务', category: 'other' },
  { id: 12, name: '低预算', category: 'other' },
];

const baseActivities: Activity[] = [
  {
    id: 1001,
    cityId: 1,
    cityName: '北京',
    title: '在奥森盲走一段林间路',
    summary: '不设终点，沿着树影和鸟声走四十分钟。',
    description: '从奥林匹克森林公园南园出发，选择一条没走过的小路，途中完成三次随手拍。',
    category: '风景人文',
    mood: '放松',
    moodTags: ['放松', '散步', '自然'],
    environment: 'outdoor',
    minPartySize: 1,
    maxPartySize: 4,
    durationMinutes: 120,
    budgetYuan: 20,
    distanceKm: 4.2,
    district: '朝阳区',
    address: '奥林匹克森林公园南园',
    latitude: 40.017,
    longitude: 116.392,
    navigationUrl: 'https://uri.amap.com/marker?position=116.392,40.017&name=奥林匹克森林公园',
    coverImageUri: assetUri(beijingOlympicForestImage),
    steps: ['从南门入园', '任选一条林间支路', '在湖边休息并拍一张照片'],
    tips: ['穿舒适的鞋', '傍晚光线更柔和'],
    accentColor: '#C9FF62',
  },
  {
    id: 1002,
    cityId: 2,
    cityName: '上海',
    title: '武康路建筑色卡挑战',
    summary: '沿老街收集五种颜色，顺便发现一家没去过的小店。',
    description: '从武康大楼出发，向安福路方向漫游，用照片收集红砖、梧桐绿与橱窗色彩。',
    category: '城市漫游',
    mood: '探索',
    moodTags: ['探索', '建筑', '拍照'],
    environment: 'outdoor',
    minPartySize: 1,
    maxPartySize: 3,
    durationMinutes: 150,
    budgetYuan: 80,
    distanceKm: 3.1,
    district: '徐汇区',
    address: '武康路历史文化名街',
    latitude: 31.205,
    longitude: 121.437,
    navigationUrl: 'https://uri.amap.com/marker?position=121.437,31.205&name=武康路',
    coverImageUri: assetUri(shanghaiImage),
    steps: ['武康大楼集合', '收集五种街区颜色', '随机挑一家小店休息'],
    tips: ['工作日上午人更少', '注意不影响沿街居民'],
    accentColor: '#78E8FF',
  },
  {
    id: 1003,
    cityId: 3,
    cityName: '杭州',
    title: '骑到西湖边等一场日落',
    summary: '沿湖轻骑，把终点交给当天最好看的那束光。',
    description: '从北山街开始骑行，经过曲院风荷，在湖边选择一处视野开阔的位置等日落。',
    category: '轻户外',
    mood: '放松',
    moodTags: ['骑行', '日落', '湖景'],
    environment: 'outdoor',
    minPartySize: 1,
    maxPartySize: 2,
    durationMinutes: 180,
    budgetYuan: 50,
    distanceKm: 6.8,
    district: '西湖区',
    address: '北山街至曲院风荷',
    latitude: 30.255,
    longitude: 120.135,
    navigationUrl: 'https://uri.amap.com/marker?position=120.135,30.255&name=西湖',
    coverImageUri: assetUri(westLakeImage),
    steps: ['租一辆单车', '沿北山街慢骑', '在湖边等日落'],
    tips: ['避开节假日高峰', '带一瓶水'],
    accentColor: '#78e8ff',
  },
  {
    id: 1004,
    cityId: 4,
    cityName: '深圳',
    title: '登上莲花山看城市亮灯',
    summary: '在天色变蓝的时刻抵达山顶，等待城市依次亮起来。',
    description: '从莲花山公园南门慢慢上山，在山顶广场看福田中心区进入夜晚。',
    category: '城市风景',
    mood: '探索',
    moodTags: ['夜景', '公园', '轻徒步'],
    environment: 'outdoor',
    minPartySize: 1,
    maxPartySize: 4,
    durationMinutes: 120,
    budgetYuan: 20,
    distanceKm: 3.7,
    district: '福田区',
    address: '莲花山公园',
    latitude: 22.554,
    longitude: 114.061,
    navigationUrl: 'https://uri.amap.com/marker?position=114.061,22.554&name=莲花山公园',
    coverImageUri: assetUri(shenzhenLianhuashanImage),
    steps: ['南门入园', '慢走登顶', '等待城市亮灯'],
    tips: ['日落前四十分钟出发', '雨后石阶注意防滑'],
    accentColor: '#c9ff62',
  },
  {
    id: 1005,
    cityId: 5,
    cityName: '天津',
    title: '在五大道收集四种建筑颜色',
    summary: '把洋楼变成一张城市色卡，边走边找细节。',
    description: '从民园广场出发，在五大道街区寻找红、黄、绿、白四种建筑主色。',
    category: '风景人文',
    mood: '探索',
    moodTags: ['建筑', '拍照', '散步'],
    environment: 'outdoor',
    minPartySize: 1,
    maxPartySize: 4,
    durationMinutes: 150,
    budgetYuan: 50,
    distanceKm: 3.9,
    district: '和平区',
    address: '五大道文化旅游区',
    latitude: 39.116,
    longitude: 117.198,
    navigationUrl: 'https://uri.amap.com/marker?position=117.198,39.116&name=五大道',
    coverImageUri: assetUri(tianjinFiveAvenuesImage),
    steps: ['民园广场出发', '寻找四种建筑主色', '选最喜欢的一栋拍合照'],
    tips: ['上午侧光适合拍建筑', '部分院落不可进入'],
    accentColor: '#ffcf68',
  },
  {
    id: 1006,
    cityId: 6,
    cityName: '烟台',
    title: '沿滨海路追一段海风',
    summary: '不赶景点，只沿海走到想停下来的地方。',
    description: '从第一海水浴场附近出发，沿滨海北路慢走，在礁石与海湾之间选一处休息。',
    category: '山海风景',
    mood: '放松',
    moodTags: ['看海', '散步', '日落'],
    environment: 'outdoor',
    minPartySize: 1,
    maxPartySize: 4,
    durationMinutes: 180,
    budgetYuan: 60,
    distanceKm: 5.2,
    district: '芝罘区',
    address: '滨海北路',
    latitude: 37.536,
    longitude: 121.406,
    navigationUrl: 'https://uri.amap.com/marker?position=121.406,37.536&name=滨海北路',
    coverImageUri: assetUri(yantaiImage),
    steps: ['从海边出发', '沿滨海路向东慢走', '找一处看海的位置休息'],
    tips: ['海边风大，带一件薄外套', '不要翻越安全护栏'],
    accentColor: '#78e8ff',
  },
  {
    id: 1007,
    cityId: 2,
    cityName: '上海',
    title: '去滨江做一次日落观察员',
    summary: '用四十分钟记录天空与江面的颜色变化。',
    description: '在徐汇滨江挑一处长椅坐下，记录日落前后天空、建筑和江面的三次变化。',
    category: '城市风景',
    mood: '放松',
    moodTags: ['日落', '滨江', '独处'],
    environment: 'outdoor',
    minPartySize: 1,
    maxPartySize: 2,
    durationMinutes: 90,
    budgetYuan: 30,
    distanceKm: 4.5,
    district: '徐汇区',
    address: '徐汇滨江绿地',
    latitude: 31.182,
    longitude: 121.463,
    navigationUrl: 'https://uri.amap.com/marker?position=121.463,31.182&name=徐汇滨江',
    coverImageUri: assetUri(shanghaiImage),
    steps: ['找到一张面向江面的长椅', '拍下三次天空变化', '日落后沿江散步'],
    tips: ['提前查看天气', '周末傍晚人较多'],
    accentColor: '#ff8f72',
  },
];

type CityActivitySeed = {
  id: number;
  cityId: number;
  cityName: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  mood: string;
  durationMinutes: number;
  budgetYuan: number;
  distanceKm: number;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  coverImageUri: string;
  steps: string[];
  tips: string[];
  accentColor: string;
};

function createCityActivity(seed: CityActivitySeed): Activity {
  return {
    ...seed,
    moodTags: [seed.mood, seed.category, '城市漫游'],
    environment: 'outdoor',
    minPartySize: 1,
    maxPartySize: 4,
    navigationUrl: `https://uri.amap.com/marker?position=${seed.longitude},${seed.latitude}&name=${encodeURIComponent(seed.address)}`,
  };
}

const additionalActivities: Activity[] = [
  createCityActivity({
    id: 1008, cityId: 7, cityName: '青岛',
    title: '从八大关走到海边收集红瓦色卡',
    summary: '在林荫路、老建筑和海岸之间，收集一组属于青岛的颜色。',
    description: '从八大关景区慢走到第二海水浴场，只拍红瓦、树影和海面三组颜色，最后在岸边停留十分钟。',
    category: '风景人文', mood: '放松', durationMinutes: 150, budgetYuan: 50, distanceKm: 4.2,
    district: '市南区', address: '八大关风景区至第二海水浴场', latitude: 36.0524, longitude: 120.3452,
    coverImageUri: qingdaoImage,
    steps: ['从八大关林荫路出发', '收集红瓦、树影和海面三种颜色', '在海边停留十分钟'],
    tips: ['海边风大时带薄外套', '不进入未开放建筑'], accentColor: '#78E8FF',
  }),
  createCityActivity({
    id: 1009, cityId: 8, cityName: '南京',
    title: '沿陵园路梧桐走到明孝陵',
    summary: '让梧桐、城墙与山林把一段周末变成电影画面。',
    description: '从苜蓿园一带进入陵园路，沿梧桐大道慢走到明孝陵附近，只选择一处历史细节认真看。',
    category: '风景人文', mood: '放松', durationMinutes: 180, budgetYuan: 80, distanceKm: 5.1,
    district: '玄武区', address: '陵园路梧桐大道至明孝陵', latitude: 32.0584, longitude: 118.8333,
    coverImageUri: nanjingImage,
    steps: ['从陵园路入口出发', '沿梧桐大道慢走', '选一处历史细节停留'],
    tips: ['节假日尽量早到', '步行路线较长，穿舒适鞋'], accentColor: '#C9FF62',
  }),
  createCityActivity({
    id: 1010, cityId: 9, cityName: '武汉',
    title: '在东湖绿道骑到湖面变蓝',
    summary: '用一段湖边骑行，把注意力从屏幕换到风和水面。',
    description: '从东湖绿道湖光序曲附近租车出发，沿湖骑行，不追求里程，只在最喜欢的一处湖湾停下。',
    category: '轻户外', mood: '探索', durationMinutes: 180, budgetYuan: 60, distanceKm: 7.5,
    district: '武昌区', address: '东湖绿道湖光序曲', latitude: 30.5621, longitude: 114.4097,
    coverImageUri: wuhanImage,
    steps: ['湖光序曲附近租车', '沿湖骑到想停下的位置', '在湖湾休息后原路返回'],
    tips: ['高温天气避开正午', '骑行时遵守绿道规则'], accentColor: '#78E8FF',
  }),
  createCityActivity({
    id: 1011, cityId: 10, cityName: '成都',
    title: '在人民公园把下午交给一杯茶',
    summary: '不赶景点，在茶馆、树影和城市闲谈里体验成都的松弛。',
    description: '到人民公园找一处露天茶座，点一杯盖碗茶，至少坐满四十分钟，再沿少城街巷散步。',
    category: '城市漫游', mood: '放松', durationMinutes: 150, budgetYuan: 80, distanceKm: 3.4,
    district: '青羊区', address: '人民公园与少城街巷', latitude: 30.6614, longitude: 104.0555,
    coverImageUri: chengduImage,
    steps: ['在公园找一处露天茶座', '安静喝茶四十分钟', '沿少城街巷随意散步'],
    tips: ['周末茶座可能需要等位', '尊重本地休闲秩序'], accentColor: '#D9A94E',
  }),
  createCityActivity({
    id: 1012, cityId: 11, cityName: '西安',
    title: '在城墙上追一段古都夜色',
    summary: '从黄昏走到灯亮，用高处视角重新认识西安。',
    description: '傍晚从永宁门登城墙，向东或向西慢走，在灯光亮起后选择一处城楼停留。',
    category: '历史夜游', mood: '探索', durationMinutes: 150, budgetYuan: 100, distanceKm: 5.0,
    district: '碑林区', address: '西安城墙永宁门', latitude: 34.2493, longitude: 108.9427,
    coverImageUri: xianImage,
    steps: ['日落前从永宁门登城', '沿城墙任选方向慢走', '灯亮后在城楼停留'],
    tips: ['确认当日开放时间', '城墙风大时注意保暖'], accentColor: '#FFCF68',
  }),
  createCityActivity({
    id: 1013, cityId: 12, cityName: '长沙',
    title: '沿湘江走到橘子洲夜色亮起',
    summary: '把江风、城市灯光和街头烟火串成一条轻松路线。',
    description: '从湘江东岸出发，沿江慢走观察橘子洲与城市灯光，最后只选一种长沙小吃收尾。',
    category: '城市夜游', mood: '热闹', durationMinutes: 150, budgetYuan: 80, distanceKm: 4.6,
    district: '岳麓区', address: '橘子洲与湘江风光带', latitude: 28.1914, longitude: 112.9615,
    coverImageUri: changshaImage,
    steps: ['从湘江风光带出发', '沿江看橘子洲亮灯', '只选一种小吃收尾'],
    tips: ['热门时段提前规划交通', '江边注意步行安全'], accentColor: '#FF8F72',
  }),
  createCityActivity({
    id: 1014, cityId: 13, cityName: '广州',
    title: '从永庆坊走到荔枝湾听粤语街声',
    summary: '沿骑楼与水岸慢走，找一处传统和年轻生活交叠的细节。',
    description: '从永庆坊进入西关街巷，沿恩宁路走到荔枝湾，途中选一栋骑楼和一家老字号认真观察。',
    category: '风景人文', mood: '探索', durationMinutes: 150, budgetYuan: 100, distanceKm: 4.1,
    district: '荔湾区', address: '永庆坊至荔枝湾', latitude: 23.1163, longitude: 113.2388,
    coverImageUri: guangzhouImage,
    steps: ['从永庆坊进入西关', '找一栋喜欢的骑楼', '沿荔枝湾慢走收尾'],
    tips: ['夏季注意防晒补水', '老街区避免打扰居民'], accentColor: '#C9FF62',
  }),
  createCityActivity({
    id: 1015, cityId: 14, cityName: '合肥',
    title: '在天鹅湖边完成一次未来城市观察',
    summary: '从湖岸看向城市新中心，记录自然、建筑和科技感的交界。',
    description: '沿天鹅湖公园步道慢走，分别拍下一张自然、一张公共建筑和一张城市灯光照片。',
    category: '未来城市', mood: '探索', durationMinutes: 120, budgetYuan: 30, distanceKm: 4.0,
    district: '蜀山区', address: '天鹅湖公园', latitude: 31.8157, longitude: 117.2272,
    coverImageUri: hefeiImage,
    steps: ['从湖岸步道出发', '记录自然、建筑和灯光三类画面', '在城市新中心方向停留'],
    tips: ['夜间注意湖边安全', '适合天气通透的傍晚'], accentColor: '#78E8FF',
  }),
  createCityActivity({
    id: 1016, cityId: 15, cityName: '重庆',
    title: '沿山城步道寻找三次空间反转',
    summary: '从屋顶走到街道，再从街道看见轻轨，用脚理解立体重庆。',
    description: '从山城巷附近出发，沿步道寻找楼梯、穿楼交通和高低落差三种空间反转。',
    category: '城市漫游', mood: '探索', durationMinutes: 180, budgetYuan: 80, distanceKm: 5.6,
    district: '渝中区', address: '山城巷传统风貌区', latitude: 29.5549, longitude: 106.5702,
    coverImageUri: chongqingImage,
    steps: ['从山城巷进入步道', '寻找三种空间反转', '在江景平台结束路线'],
    tips: ['台阶较多，穿防滑鞋', '雨天调整为较短路线'], accentColor: '#FF795E',
  }),
  createCityActivity({
    id: 1017, cityId: 16, cityName: '厦门',
    title: '沿环岛路骑到一处没计划的海滩',
    summary: '让海风决定终点，不追热门打卡点。',
    description: '从曾厝垵附近租车，沿环岛路向任意方向骑行，在第一处想停下的海滩休息。',
    category: '轻户外', mood: '放松', durationMinutes: 180, budgetYuan: 80, distanceKm: 8.0,
    district: '思明区', address: '环岛路曾厝垵附近', latitude: 24.4434, longitude: 118.1216,
    coverImageUri: xiamenImage,
    steps: ['曾厝垵附近租车', '沿环岛路任选方向骑行', '在第一处想停的海滩休息'],
    tips: ['注意骑行车道和行人', '海边紫外线强，做好防晒'], accentColor: '#78E8FF',
  }),
  createCityActivity({
    id: 1018, cityId: 17, cityName: '济南',
    title: '从曲水亭街循着泉声走到大明湖',
    summary: '不看地图，只沿水声和老街走进泉城的日常。',
    description: '从曲水亭街出发，沿水渠慢走到大明湖，途中找一处泉水边观察当地生活。',
    category: '风景人文', mood: '放松', durationMinutes: 120, budgetYuan: 50, distanceKm: 3.2,
    district: '历下区', address: '曲水亭街至大明湖', latitude: 36.6747, longitude: 117.0249,
    coverImageUri: jinanImage,
    steps: ['从曲水亭街沿水渠出发', '在泉水边停留观察', '步行进入大明湖'],
    tips: ['保持泉池周边清洁', '夏季注意防晒'], accentColor: '#58BFA8',
  }),
  createCityActivity({
    id: 1019, cityId: 18, cityName: '昆明',
    title: '从翠湖走到文化巷找一束当季花',
    summary: '在高原阳光、湖边树影和花市色彩中慢慢度过半天。',
    description: '从翠湖公园开始散步，经文林街到文化巷，只凭颜色选择一束当季花或一份小食。',
    category: '城市漫游', mood: '放松', durationMinutes: 150, budgetYuan: 80, distanceKm: 3.8,
    district: '五华区', address: '翠湖公园至文化巷', latitude: 25.0544, longitude: 102.7035,
    coverImageUri: kunmingImage,
    steps: ['沿翠湖慢走一圈', '经文林街前往文化巷', '只凭颜色选一束花或一份小食'],
    tips: ['高原紫外线强，注意防晒', '尊重市场和街区秩序'], accentColor: '#C9FF62',
  }),
];

export const demoActivities = [...baseActivities, ...additionalActivities];

export const demoAttractions: Attraction[] = demoActivities.map((item, index) => ({
  id: item.id,
  destinationId: item.cityId,
  activityId: item.id,
  name: item.title,
  summary: item.summary,
  coverImageUri: item.coverImageUri ?? null,
  ticketPriceMax: item.budgetYuan,
  rating: 4.6 + (index % 3) * 0.1,
  suggestedDuration: item.durationMinutes,
  popularity: 90 + (index % 7),
  destinationName: item.cityName,
}));

function createUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
    const random = Math.floor(Math.random() * 16);
    return (token === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

export function createDemoGuest(deviceId: string): GuestUser {
  return {
    id: 900001,
    deviceId,
    nickname: '周末玩家',
    phone: null,
    email: null,
    authType: 'guest',
  };
}

export function createDemoDraw(
  input: DrawRequest,
  previous?: DrawResult | null,
): DrawResult {
  const isNationwide = input.preferences.destinationScope === 'nationwide';
  let candidates = isNationwide
    ? demoActivities
    : demoActivities.filter((activity) => activity.cityId === input.cityId);
  if (!candidates.length) candidates = demoActivities;

  const previousIndex = previous
    ? candidates.findIndex((activity) => activity.id === previous.activity.id)
    : -1;
  const seed = previousIndex >= 0
    ? previousIndex + 1
    : Math.floor((input.preferences.randomLevel / 100) * candidates.length);
  const activity = candidates[Math.abs(seed) % candidates.length];
  const attemptsUsed = previous ? previous.attemptsUsed + 1 : 1;

  return {
    drawSessionId: previous?.drawSessionId ?? createUuid(),
    attemptsUsed,
    attemptsRemaining: Math.max(0, 3 - attemptsUsed),
    activity,
    recommendation: {
      status: 'selected',
      cardId: activity.id,
      poiId: activity.id,
      reason: `符合你“${input.preferences.mood}”的心情，也在本次预算与出行范围内。`,
      constraintSummary: {
        distance: input.preferences.destinationScopeLabel ?? '按当前范围',
        budget: input.preferences.budgetLabel ?? `约 ¥${activity.budgetYuan}`,
        time: input.preferences.travelDurationLabel ?? `${activity.durationMinutes} 分钟`,
        random: input.preferences.surpriseLevelLabel ?? '中度惊喜',
      },
      display: {
        badge: '本地可玩方案',
        cardPage: '盲盒结果',
        detailPage: '玩法详情',
        schedulePage: '加入行程',
        executableLabel: '现在可以出发',
      },
    },
  };
}
