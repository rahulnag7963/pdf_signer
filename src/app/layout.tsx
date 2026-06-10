import type { Metadata } from 'next';
import { Caveat, Dancing_Script, Great_Vibes, Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});
const dancingScript = Dancing_Script({ subsets: ['latin'], variable: '--font-dancing' });
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400', variable: '--font-great-vibes' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' });

export const metadata: Metadata = {
  title: 'InkPress — Sign PDFs in seconds',
  description: 'Add your signature, text, and date to any PDF — right in your browser. Files never leave your machine.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${dancingScript.variable} ${greatVibes.variable} ${caveat.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
