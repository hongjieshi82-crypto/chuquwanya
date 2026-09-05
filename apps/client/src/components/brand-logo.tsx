import { Image, type ImageStyle, type StyleProp } from 'react-native';

export function BrandLogo({ style }: { className?: string; style?: StyleProp<ImageStyle> }) {
  return <Image resizeMode="contain" source={require('../../assets/images/chuquwanya-logo.png')} style={style} />;
}
