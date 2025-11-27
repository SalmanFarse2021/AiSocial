import "./globals.css";
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata = {
  title: "AiSocial",
  description: "AiSocial — your social world, brought together",
};

import { CallProvider } from '@/contexts/CallContext';

export default function RootLayout({ children }) {
  const themeScript = `
    (function() {
      try {
        var stored = localStorage.getItem('aisocial-theme');
        var theme = stored || 'dark';
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (err) {
        document.documentElement.classList.add('dark');
      }
    })();
  `;

  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
          suppressHydrationWarning
        />
        <ThemeProvider>
          <CallProvider>
            {children}
          </CallProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
