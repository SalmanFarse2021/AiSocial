import "./globals.css";

export const metadata = {
  title: "AiSocial",
  description: "AiSocial — your social world, brought together",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
