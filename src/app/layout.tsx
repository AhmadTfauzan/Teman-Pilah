import type { Metadata } from "next";
import { Poppins, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Teman Pilah | Bersama Membangun Ekosistem Hijau",
  description: "Platform komunitas lingkungan hidup Indonesia untuk pengelolaan sampah, edukasi daur ulang, dan produk upcycled.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${poppins.variable} ${jakarta.variable} font-poppins bg-[#FFFFFF] text-[#3D3D3D] antialiased`}>
        <Toaster position="top-center" richColors />
        {children}
      </body>
    </html>
  );
}
