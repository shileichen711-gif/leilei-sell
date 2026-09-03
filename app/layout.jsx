import "./globals.css";

export const metadata = {
  title: "阿拉蕾 · 文创产品工作台",
  description: "私密的文创产品开发、成本回本与排期管理工具",
  manifest: "/manifest.webmanifest",
  applicationName: "文创工作台",
  icons: {
    icon: [
      { url: "/icons/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "文创工作台",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#20251f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
