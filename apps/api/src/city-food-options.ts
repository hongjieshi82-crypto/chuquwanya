import type { MealOption } from './itinerary-policy.js';
/** Named options with source links. These are not bookings or live opening checks. */
export const cityFoodOptions: Record<number, MealOption[]> = {
  820105: [
    { name: '胡大饭馆（簋街门店）', area: '北京·簋街', note: '小龙虾等菜品备选；先确认具体分店、辣度、份量与等位，甲壳类过敏者选择其他菜品或餐厅。', source: 'https://www.visitbeijing.com.cn/article/4RyX2qVCc6x' },
    { name: '花家怡园（簋街店）', area: '北京·簋街', note: '京味正餐备选；两家任选一家，按人数和菜单控制消费，不要求连续用餐。', source: 'https://www.visitbeijing.com.cn/article/47QnC2hf7IZ' },
  ],
  820106: [
    { name: '护国寺小吃（护国寺总店）', area: '北京·护国寺街', note: '先选一份主食，再按食量加少量糕点；询问食材和份量，营业以门店为准。', source: 'https://www.visitbeijing.com.cn/article/47QmSgpFRYz' },
    { name: '合义斋（护国寺街）', area: '北京·护国寺街', note: '同街区备选，出发前确认营业与门店位置；不强制两家都消费。', source: 'https://www.visitbeijing.com.cn/article/47QmmJoQQ1o' },
  ],
};
