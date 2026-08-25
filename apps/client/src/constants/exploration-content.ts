import type { AppIconName } from '@/components/app-icon';
import { tagColors } from '@/theme';

/** APP 首页与 H5 高保真稿共用的探索内容数据 */
export const NEARBY_SPOTS = [
  { id: '1', name: '西岸美术馆', tag: '城市', distance: '1.2km', tone: tagColors.city, price: '免费' },
  { id: '2', name: '徐汇滨江', tag: '漫步', distance: '2.8km', tone: tagColors.hike, price: '免费' },
  { id: '3', name: '武康路街区', tag: '摄影', distance: '3.5km', tone: tagColors.season, price: '免费' },
] as const;

export const THEME_DESTINATIONS = [
  { id: '1', name: '周边游', icon: 'bus' as AppIconName, tone: tagColors.city },
  { id: '2', name: '徒步', icon: 'hike' as AppIconName, tone: tagColors.hike },
  { id: '3', name: '露营', icon: 'camp' as AppIconName, tone: tagColors.camp },
  { id: '4', name: '城市', icon: 'city' as AppIconName, tone: tagColors.city },
  { id: '5', name: '更多', icon: 'more' as AppIconName, tone: tagColors.season },
] as const;

export const FEATURED_ROUTES = [
  {
    id: '1',
    code: 'NO.023',
    title: '莫干山竹林小径',
    meta: '16km · 轻松 · 2.5h',
    price: '299',
    priceLabel: '起/人',
    badge: '热销',
    gradient: ['#26A4FF', '#0086F6'] as const,
  },
  {
    id: '2',
    code: 'NO.031',
    title: '千岛湖环湖线',
    meta: '24km · 中等 · 4h',
    price: '459',
    priceLabel: '起/人',
    badge: '特惠',
    gradient: ['#4DB8FF', '#006FD6'] as const,
  },
] as const;

export const DISCOVER_DESTINATIONS = [
  {
    id: '1',
    title: '安吉竹海',
    location: '浙江 · 湖州',
    rating: '4.9',
    reviews: '2.3万',
    tag: '徒步',
    price: '198',
    tone: tagColors.hike,
  },
  {
    id: '2',
    title: '朱家角水乡',
    location: '上海 · 青浦',
    rating: '4.7',
    reviews: '1.8万',
    tag: '城市',
    price: '免费',
    tone: tagColors.city,
  },
] as const;

export const BRAND_COPY = {
  name: '懒得动',
  sub: '发现你的下一段旅程',
  slogan: '世界很大，马上出发。',
  features: '发现路线 · 规划行程 · 分享探索',
} as const;

export const PROMO_BANNERS = [
  { id: '1', title: '周末轻徒步专区', sub: '精选 12 条路线 · 新人立减', tone: '#0086F6' },
  { id: '2', title: '城市微度假', sub: '2 小时车程内的惊喜', tone: '#006FD6' },
] as const;

/** 地图页标注（经纬度用于高德地图，百分比坐标保留给非 Web 回退） */
export const MAP_PINS = [
  {
    id: '1',
    name: '西岸美术馆',
    tag: '城市',
    distance: '1.2km',
    longitude: 121.4653,
    latitude: 31.1839,
    x: 28,
    y: 42,
    tone: tagColors.city,
  },
  {
    id: '2',
    name: '徐汇滨江',
    tag: '漫步',
    distance: '2.8km',
    longitude: 121.4591,
    latitude: 31.1872,
    x: 52,
    y: 58,
    tone: tagColors.hike,
  },
  {
    id: '3',
    name: '武康路街区',
    tag: '摄影',
    distance: '3.5km',
    longitude: 121.4422,
    latitude: 31.2077,
    x: 68,
    y: 35,
    tone: tagColors.season,
  },
  {
    id: '4',
    name: '愚园路',
    tag: 'City Walk',
    distance: '4.1km',
    longitude: 121.4356,
    latitude: 31.2216,
    x: 38,
    y: 68,
    tone: tagColors.city,
  },
] as const;

export const MAP_FILTERS = ['全部', '徒步', '城市', '露营', '摄影'] as const;

/** 地图选城页标注（经纬度用于高德地图，百分比坐标保留给非 Web 回退） */
export const TOUR_CITY_PINS = [
  { id: 'bj', name: '北京', longitude: 116.4074, latitude: 39.9042, x: 62, y: 28 },
  { id: 'sh', name: '上海', longitude: 121.4737, latitude: 31.2304, x: 78, y: 52 },
  { id: 'hz', name: '杭州', longitude: 120.1551, latitude: 30.2741, x: 76, y: 58 },
  { id: 'nj', name: '南京', longitude: 118.7969, latitude: 32.0603, x: 72, y: 50 },
  { id: 'cd', name: '成都', longitude: 104.0665, latitude: 30.5723, x: 38, y: 58 },
  { id: 'cq', name: '重庆', longitude: 106.5516, latitude: 29.563, x: 44, y: 62 },
  { id: 'xa', name: '西安', longitude: 108.9398, latitude: 34.3416, x: 48, y: 46 },
  { id: 'gz', name: '广州', longitude: 113.2644, latitude: 23.1291, x: 62, y: 78 },
  { id: 'sz', name: '深圳', longitude: 114.0579, latitude: 22.5431, x: 66, y: 82 },
  { id: 'xm', name: '厦门', longitude: 118.0894, latitude: 24.4798, x: 74, y: 76 },
  { id: 'wh', name: '武汉', longitude: 114.3055, latitude: 30.5928, x: 58, y: 54 },
  { id: 'km', name: '昆明', longitude: 102.8329, latitude: 24.8801, x: 34, y: 78 },
] as const;

export const PROFILE_STATS = [
  { id: 'dest', label: '目的地', value: '12' },
  { id: 'route', label: '路线', value: '8' },
  { id: 'km', label: '探索 km', value: '156' },
] as const;

export const PROFILE_MENU = [
  { id: 'about', icon: 'info' as AppIconName, label: '关于懒得动', hint: 'v0.5' },
] as const;

export const FAVORITE_TABS = ['全部', '路线', '目的地'] as const;

export const FAVORITE_ITEMS = [
  {
    id: 'f1',
    type: 'route' as const,
    title: '莫干山竹林小径',
    meta: '16km · 轻松 · 2.5h',
    location: '浙江 · 湖州',
    price: '299',
    priceLabel: '起/人',
    badge: '热销',
    tone: tagColors.hike,
  },
  {
    id: 'f2',
    type: 'route' as const,
    title: '千岛湖环湖线',
    meta: '24km · 中等 · 4h',
    location: '浙江 · 杭州',
    price: '459',
    priceLabel: '起/人',
    badge: '特惠',
    tone: tagColors.city,
  },
  {
    id: 'f3',
    type: 'dest' as const,
    title: '安吉竹海',
    meta: '4.9 · 2.3万条评价',
    location: '浙江 · 湖州',
    price: '198',
    priceLabel: '起',
    badge: '徒步',
    tone: tagColors.hike,
  },
  {
    id: 'f4',
    type: 'dest' as const,
    title: '朱家角水乡',
    meta: '4.7 · 1.8万条评价',
    location: '上海 · 青浦',
    price: '免费',
    priceLabel: '',
    badge: '城市',
    tone: tagColors.city,
  },
] as const;

export const ABOUT_INFO = {
  version: 'v0.5',
  tagline: '关于懒得动 · 携程风格探索主题',
  description: '帮你发现路线、智能推荐玩法、管理行程。',
  links: [
    { id: 'privacy', label: '隐私政策' },
    { id: 'terms', label: '用户协议' },
  ],
} as const;
