// POI metadata checked against Amap place search on 2026-09-07.
// Coordinates locate the POI, not a promise of door-to-door travel duration.
export const beijingVerified: Record<number, {poiId:string; longitude:number; latitude:number; windows:[number,number][]; rawHours:string; reservation:'no'|'unknown'}> = {
  810002: {poiId:'B000A80UL1',longitude:116.391802,latitude:39.928775,windows:[[360,1260]],rawHours:'06:00-21:00；园内单独收费景点另行确认',reservation:'unknown'},
  810003: {poiId:'B000A7O5PK',longitude:116.385121,latitude:39.941893,windows:[[0,1440]],rawHours:'公共区域24小时，临时封闭以现场为准；不含游船和商户',reservation:'no'},
  820101: {poiId:'B000A81FMM',longitude:116.414443,latitude:39.953777,windows:[[360,1230]],rawHours:'5—10月06:00-21:30；其余月份06:00-20:30；仅公园公共游览区',reservation:'unknown'},
  860101: {poiId:'B0FFHF130I',longitude:116.424768,latitude:39.941746,windows:[[1020,1680]],rawHours:'街区17:00-次日04:00；具体餐厅营业需单独确认',reservation:'no'},
  860103: {poiId:'B000A7O5PK',longitude:116.385121,latitude:39.941893,windows:[[1020,1470]],rawHours:'公共区域24小时；本路线选17:00-次日00:30，临时封闭以现场为准',reservation:'no'},
};
export function verifiedMetadata(id:number) {
  const entry = beijingVerified[id];
  if (!entry) return {};
  return {latitude:entry.latitude,longitude:entry.longitude,
    navigationUrl:`https://uri.amap.com/marker?position=${entry.longitude},${entry.latitude}&name=${encodeURIComponent('路线集合区域')}`,
    openingHours:{windows:entry.windows,description:entry.rawHours,checkedOn:'2026-09-07',source:`https://www.amap.com/place/${entry.poiId}`},
    reservationRequired:entry.reservation,
    rainFriendly:'no' as const,heatSensitive:'yes' as const,windSensitive:'yes' as const,
    weatherNotes:'含户外步行，降雨、高温和大风时不推荐；这是保守筛选规则，不是实时天气报告。',
    lastVerifiedAt:'2026-09-07',sourceUrl:`https://www.amap.com/place/${entry.poiId}`};
}
