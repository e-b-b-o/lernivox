import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Lernivox — AI-Powered Study Platform',
  description: 'Transform textbooks and lecture documents into an interactive, high-retention learning environment with source-grounded citations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-lernivox-cream text-lernivox-forest antialiased">
        {children}
      </body>
    </html>
  );
}
