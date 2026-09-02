import { ArrowLeftOutlined, ArrowRightOutlined, CheckCircleFilled, GiftOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Space, Tag, Typography } from 'antd';
import 'antd/dist/reset.css';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, type CSSProperties } from 'react';

import { palette, radii } from '@/theme';
import { demoCityImageUris, demoPlaceImageUris } from '@/services/demo-data';

const { Paragraph, Title } = Typography;

type ThemeConfig = {
  eyebrow: string;
  title: string;
  lead: string;
  image: string;
  color: string;
  glow: string;
  features: string[];
  examples: string[];
};

const themes: Record<string, ThemeConfig> = {
  scene: {
    eyebrow: '风景人文',
    title: '从一座城市的山水与老故事开始',
    lead: '更少排队打卡，更多沿途、建筑、风景和城市记忆。',
    image: demoCityImageUris.hangzhou,
    color: '#6752D8',
    glow: 'rgba(126,166,31,.28)',
    features: ['锁定城市与人文风格', '优先自然风景与历史街区', '适合慢速度的半日出行'],
    examples: ['在胡同随机拐三次', '绕湖走一段陌生的路', '沿海等一次日落'],
  },
  theme: {
    eyebrow: '随心漫游',
    title: '不设终点，让城市带你走一段',
    lead: '少一点必须完成，多一点临时起意和路上的意外。',
    image: demoPlaceImageUris.beijingOlympicForest,
    color: '#C9FF62',
    glow: 'rgba(142,200,255,.34)',
    features: ['以周边和探索心情为主', '随机路线与微型挑战', '不满意可以换一个方向'],
    examples: ['去公园盲走四十分钟', '坐一站没坐过的轮渡', '用三座桥串起一条路'],
  },
  audience: {
    eyebrow: '结伴同行',
    title: '两个人不再互相问“去哪”',
    lead: '把选择交给旅行老虎机，你们只需要决定要不要现在出发。',
    image: demoCityImageUris.yantai,
    color: '#8A63E8',
    glow: 'rgba(255,178,109,.3)',
    features: ['自动设置双人出行', '兼顾聊天与共同体验', '避免过高强度和过长路线'],
    examples: ['一起挑一本陌生的书', '在海边带一份小食', '让店员替你们选一杯饮品'],
  },
  food: {
    eyebrow: '寻味探购',
    title: '不看排名，只凭香味和直觉',
    lead: '在老街、菜市场和街角小店里，抽一份真正能吃到的城市烟火。',
    image: demoCityImageUris.shanghai,
    color: '#A85E76',
    glow: 'rgba(255,139,106,.28)',
    features: ['平价预算和热闹心情', '优先街区、小店与本地味道', '保留过敏原和排队提醒'],
    examples: ['不打开点评软件选店', '在老城盲选一份小吃', '用今天的心情换一杯陌生饮品'],
  },
};

const themeCss = `
.pc-theme-page { min-height: calc(100dvh - 76px); padding: 42px clamp(24px,5vw,72px) 76px; background: linear-gradient(180deg,#F7F4FF,#FFF); }
.pc-theme-shell { --theme-color:#C9FF62; --theme-glow:rgba(126,166,31,.3); width:min(100%,1180px); margin:0 auto; }
.pc-theme-back.ant-btn { margin-bottom:18px; color:${palette.text}; font-weight:800; }
.pc-theme-hero { position:relative; min-height:570px; overflow:hidden; border-radius:40px; background:#1D1739; box-shadow:0 32px 78px rgba(35,25,87,.24); }
.pc-theme-photo { position:absolute; inset:0 0 0 48%; width:52%; height:100%; object-fit:cover; opacity:.8; mask-image:linear-gradient(90deg,transparent,#000 34%); -webkit-mask-image:linear-gradient(90deg,transparent,#000 34%); }
.pc-theme-hero::after { content:""; position:absolute; inset:0; background:radial-gradient(circle at 72% 30%,var(--theme-glow),transparent 36%),linear-gradient(90deg,#1D1739 0 48%,rgba(29,23,57,.45)); }
.pc-theme-copy { position:relative; z-index:2; width:58%; min-height:570px; padding:68px; display:flex; flex-direction:column; justify-content:center; }
.pc-theme-eyebrow.ant-tag { align-self:flex-start; margin:0 0 22px; padding:7px 13px; border:1px solid rgba(255,255,255,.18); border-radius:999px; color:#FFF; background:var(--theme-color); font-weight:900; }
.pc-theme-copy h1.ant-typography { margin:0; color:#FFF; font-size:clamp(44px,5vw,68px); line-height:1.08; font-weight:900; }
.pc-theme-copy > p.ant-typography { margin:22px 0 0; max-width:620px; color:rgba(255,255,255,.72); font-size:17px; line-height:1.8; }
.pc-theme-features { margin:30px 0; display:grid; gap:10px; color:rgba(255,255,255,.86); }
.pc-theme-feature { display:flex; align-items:center; gap:10px; font-weight:700; }.pc-theme-feature svg{color:#E8D078;}
.pc-theme-actions .ant-btn { min-height:50px; border-radius:${radii.pill}px; font-weight:900; }
.pc-theme-examples { margin-top:24px; padding:32px; border:1px solid rgba(232,225,255,.84); border-radius:28px; background:#FFF; }
.pc-theme-examples h3.ant-typography { margin:0 0 18px; color:${palette.ink}; }
.pc-theme-example-list { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.pc-theme-example { padding:18px; border-radius:18px; color:${palette.text}; background:#F7F5FF; font-weight:800; }
@media(max-width:850px){.pc-theme-photo{inset:42% 0 0;width:100%;height:58%;mask-image:linear-gradient(180deg,transparent,#000 34%);-webkit-mask-image:linear-gradient(180deg,transparent,#000 34%)}.pc-theme-copy{width:100%;padding:38px 28px;justify-content:flex-start}.pc-theme-hero::after{background:linear-gradient(180deg,#1D1739 0 48%,rgba(29,23,57,.35))}.pc-theme-example-list{grid-template-columns:1fr}}
`;

export default function PcThemeScreen() {
  const router = useRouter();
  const { preset } = useLocalSearchParams<{ preset?: string }>();
  const presetKey = typeof preset === 'string' && themes[preset] ? preset : 'theme';
  const config = themes[presetKey];
  const imageUri = config.image;
  const themeStyle = { '--theme-color': config.color, '--theme-glow': config.glow } as CSSProperties;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <ConfigProvider theme={{ token: { colorPrimary: config.color, borderRadius: radii.lg } }}>
      <style>{themeCss}</style>
      <main className="pc-theme-page">
        <div className="pc-theme-shell" style={themeStyle}>
          <Button className="pc-theme-back" type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()}>返回首页</Button>
          <section className="pc-theme-hero">
            <img className="pc-theme-photo" src={imageUri} alt={config.eyebrow} />
            <div className="pc-theme-copy">
              <Tag className="pc-theme-eyebrow">{config.eyebrow}</Tag>
              <Title>{config.title}</Title>
              <Paragraph>{config.lead}</Paragraph>
              <div className="pc-theme-features">{config.features.map((feature) => <div className="pc-theme-feature" key={feature}><CheckCircleFilled />{feature}</div>)}</div>
              <Space className="pc-theme-actions" size={12} wrap>
                <Button type="primary" size="large" icon={<GiftOutlined />} onClick={() => router.push(`/box/config?preset=${presetKey}`)}>用这个主题立即抽取</Button>
                <Button size="large" icon={<ArrowRightOutlined />} onClick={() => router.push('/destinations')}>看看所有城市</Button>
              </Space>
            </div>
          </section>
          <section className="pc-theme-examples">
            <Title level={3}>你可能抽到</Title>
            <div className="pc-theme-example-list">{config.examples.map((example) => <div className="pc-theme-example" key={example}>{example}</div>)}</div>
          </section>
        </div>
      </main>
    </ConfigProvider>
  );
}
