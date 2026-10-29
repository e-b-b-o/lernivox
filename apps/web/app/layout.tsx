import type { Metadata } from 'next';
import { Bricolage_Grotesque, Instrument_Sans, Fraunces } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Lernivox — Turn Your Textbooks into Real Understanding',
  description:
    'Upload textbooks, lecture slides, and notes. Lernivox transforms course materials into guided explanations, worked methods, and verified practice—grounded directly in your source documents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${instrumentSans.variable} ${fraunces.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-lernivox-cream text-lernivox-forest font-sans antialiased selection:bg-lernivox-peach selection:text-lernivox-forest">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

