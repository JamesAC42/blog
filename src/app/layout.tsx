import type { Metadata } from "next";
import "./globals.css";
import { ScreenOverlay } from "@/components/ScreenOverlay/ScreenOverlay";
import { 
  absoluteBeauty, 
  adelia, 
  checkpoint, 
  cuteNotes, 
  missFajardose, 
  nunito, 
  starborn,
  notoSansJP,
  pixelMix,
  chalktastic,
  chewy,
  sourGummy,
  deadCRT,
  miracode
} from "@/styles/fonts";

export const metadata: Metadata = {
  title: "James Crovo",
  description: "Blog, Journal, Gallery, Projects by James Crovo",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "James Crovo",
    description: "Blog, Journal, Gallery, Projects by James Crovo",
    url: "https://jamescrovo.com",
  },
};

const fonts = [
  cuteNotes, 
  absoluteBeauty, 
  missFajardose, 
  nunito, 
  adelia, 
  checkpoint, 
  starborn,
  notoSansJP,
  pixelMix,
  chalktastic,
  chewy,
  sourGummy,
  deadCRT,
  miracode
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontClasses = fonts.map((f) => f.variable).join(" ");
  return (
    <html lang="en" className={fontClasses}>
      <body>  
        <script defer src="https://umami.ovel.sh/script.js" data-website-id="fbc72b8a-e538-45da-817a-f13ba83a2d0e"></script>
        <ScreenOverlay />
        {children}
      </body>
    </html>
  );
}
