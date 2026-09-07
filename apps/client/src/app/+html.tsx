import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return <html lang="zh-CN" translate="no">
    <head>
      <meta charSet="utf-8" />
      <title>粗去玩鸭！· 发现你的周末出游灵感</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="google" content="notranslate" />
      <ScrollViewStyleReset />
    </head>
    <body>{children}</body>
  </html>;
}
