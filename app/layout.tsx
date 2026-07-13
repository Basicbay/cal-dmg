import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "เครื่องคิดดาเมจ / Justice Online Damage Calculator",
  description: "เครื่องคิดดาเมจสำหรับค่าสเตตัสต่อสู้ Justice Online / Damage calculator for Justice Online combat stats",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
