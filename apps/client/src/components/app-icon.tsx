import EditOutlined from '@ant-design/icons-svg/es/asn/EditOutlined';
import type { AbstractNode, IconDefinition } from '@ant-design/icons-svg/es/types';

import type { AntdIconGlyph, AntdIconGlyphName } from '@/lib/antd-icon-glyphs';
import { ANTD_ICON_GLYPHS } from '@/lib/antd-icon-glyphs';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { palette } from '@/theme';

/** 应用内统一图标名（对应 Ant Design Outlined 图标） */
export type AppIconName =
  | 'home'
  | 'map'
  | 'itinerary'
  | 'user'
  | 'bell'
  | 'search'
  | 'location'
  | 'locate'
  | 'arrow-right'
  | 'arrow-left'
  | 'star'
  | 'like'
  | 'message'
  | 'info'
  | 'bus'
  | 'hike'
  | 'camp'
  | 'city'
  | 'more'
  | 'globe'
  | 'sparkle'
  | 'check'
  | 'close'
  | 'edit';

function getIconNode(definition: IconDefinition): AbstractNode {
  return typeof definition.icon === 'function'
    ? definition.icon(palette.primary, palette.primaryLight)
    : definition.icon;
}

function collectPathData(node: AbstractNode): string[] {
  const currentPath = node.tag === 'path' ? node.attrs.d : undefined;
  const childPaths = node.children?.flatMap(collectPathData) ?? [];

  return currentPath ? [currentPath, ...childPaths] : childPaths;
}

function createGlyphFromDefinition(definition: IconDefinition): AntdIconGlyph {
  const iconNode = getIconNode(definition);

  return {
    viewBox: iconNode.attrs.viewBox,
    paths: collectPathData(iconNode),
  };
}

const EXTRA_ICON_GLYPHS = {
  EditOutlined: createGlyphFromDefinition(EditOutlined),
};

type ExtraIconGlyphName = keyof typeof EXTRA_ICON_GLYPHS;
type AppIconGlyphName = AntdIconGlyphName | ExtraIconGlyphName;

const ICONS: Record<AppIconName, AppIconGlyphName> = {
  home: 'HomeOutlined',
  map: 'EnvironmentOutlined',
  itinerary: 'FileTextOutlined',
  user: 'UserOutlined',
  bell: 'BellOutlined',
  search: 'SearchOutlined',
  location: 'EnvironmentOutlined',
  locate: 'AimOutlined',
  'arrow-right': 'RightOutlined',
  'arrow-left': 'ArrowLeftOutlined',
  star: 'StarOutlined',
  like: 'LikeOutlined',
  message: 'MessageOutlined',
  info: 'InfoCircleOutlined',
  bus: 'CarOutlined',
  hike: 'FlagOutlined',
  camp: 'RestOutlined',
  city: 'BankOutlined',
  more: 'EllipsisOutlined',
  globe: 'GlobalOutlined',
  sparkle: 'StarOutlined',
  check: 'CheckOutlined',
  close: 'CloseOutlined',
  edit: 'EditOutlined',
};

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** 全端统一 Ant Design SVG 图标（Web / iOS / Android 同一套 Outlined 资源） */
export function AppIcon({ name, size = 20, color = palette.text, style }: AppIconProps) {
  const glyphName = ICONS[name];
  const glyph = glyphName in ANTD_ICON_GLYPHS
    ? ANTD_ICON_GLYPHS[glyphName as AntdIconGlyphName]
    : EXTRA_ICON_GLYPHS[glyphName as ExtraIconGlyphName];

  return (
    <View style={style}>
      <Svg viewBox={glyph.viewBox} width={size} height={size}>
        {glyph.paths.map((d, index) => (
          <Path key={index} d={d} fill={color} />
        ))}
      </Svg>
    </View>
  );
}
