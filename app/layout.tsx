import { corben } from "./fonts";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <title>Timeline Anything</title>
      <body className={`${corben.variable} font-sans `}>{children}</body>
    </html>
  );
}
