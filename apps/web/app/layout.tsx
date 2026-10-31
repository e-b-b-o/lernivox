import type { Metadata } from 'next';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  weight: ['700', '800'],
  display: 'swap',
});

const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
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
    <html lang="en" className={`${bricolage.variable} ${instrument.variable} scroll-smooth`}>
      <body className="font-sans bg-[#F4F0E5] text-[#14261D] antialiased selection:bg-[#F9D8C0] selection:text-[#14261D] overflow-x-hidden">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

