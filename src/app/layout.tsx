import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
// 引入 beaver-ui 全局样式
import 'beaver-ui/dist/index.css';
import ToastClientProvider from './components/ToastClientProvider';

// 引入 Google 字体（通过 next/font）并设置为 CSS 变量，方便在全局样式中使用
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '订单中心',
  description: '订单管理与状态机示例（Next.js App Router）',
  icons: {
    // 支持 /icon（Next 动态生成）、/favicon.svg（显式静态 SVG）和 /favicon.ico 两种路径
    icon: [
      { url: '/icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
      { url: '/icon', rel: 'shortcut icon' },
    ],
  },
};

// 根布局组件：包装整个应用的 HTML / body
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ToastClientProvider>{children}</ToastClientProvider>
      </body>
    </html>
  );
}
