import 'dotenv/config';
const key = process.env.AMAP_WEB_SERVICE_KEY;
if (!key) throw new Error('AMAP key not configured');
for (const keyword of ['亮马河国际风情水岸', '簋街', '什刹海', '北海公园', '地坛公园', '砖塔胡同']) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const url = new URL('https://restapi.amap.com/v5/place/text');
  url.search = new URLSearchParams({key,keywords:keyword,region:'北京',city_limit:'true',page_size:'3',show_fields:'business'}).toString();
  try {
    const data = await (await fetch(url, {signal:AbortSignal.timeout(12000)})).json() as {status:string;info:string;pois:unknown[]};
    console.log(JSON.stringify({keyword,status:data.status,info:data.info,pois:data.pois}));
  } catch { console.log(JSON.stringify({keyword,error:'POI request unavailable'})); }
}
