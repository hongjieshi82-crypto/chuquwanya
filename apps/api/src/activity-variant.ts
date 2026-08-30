export type VariantSourceActivity = {
  id: number;
  cityId: number;
  cityName: string;
  address: string;
  district: string;
  summary: string;
  description: string;
  category: string;
  environment: 'indoor' | 'outdoor' | 'either';
  durationMinutes: number;
  budgetYuan: number;
  latitude: number | null;
  longitude: number | null;
  navigationUrl: string | null;
  coverImage: string | null;
  accentColor: string;
  tips: string[];
  placeKey: string;
};

export function buildActivityVariants(source: VariantSourceActivity) {
  const place = source.address || source.district;
  const indoor = source.environment === 'indoor';
  return [
    {
      ...source,
      title: indoor ? `在${place}只追一种颜色` : `在${place}完成五色收集`,
      summary: indoor ? '给自己一个颜色限制，把普通参观变成一场视觉搜集。' : '不追打卡点，只收集今天在城市里遇见的五种颜色。',
      mood: '探索',
      moodTags: indoor ? ['探索', '颜色挑战', '观察'] : ['探索', '拍照', '颜色挑战'],
      steps: indoor ? ['选定今天的主题色', '寻找三件符合颜色的细节', '离开前选出最喜欢的一件'] : ['从主入口开始慢走', '依次收集五种不同颜色', '用最喜欢的颜色结束路线'],
    },
    {
      ...source,
      title: indoor ? `给${place}写三句观察` : `给${place}做一张声音地图`,
      summary: indoor ? '不用写长游记，只记录三个真实看到的细节。' : '暂时收起攻略，用三段声音记住一处真实地点。',
      mood: '放松',
      moodTags: indoor ? ['放松', '记录', '独处'] : ['放松', '声音地图', '独处'],
      steps: indoor ? ['先完整走一遍空间', '挑三个想停留的细节', '分别写下一句观察'] : ['安静走十分钟', '记录三种不同的环境声音', '在最舒服的位置停留十五分钟'],
    },
  ];
}
