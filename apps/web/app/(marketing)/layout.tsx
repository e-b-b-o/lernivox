import React from 'react';
import { Navbar } from '../../components/marketing/Navbar';
import { Footer } from '../../components/marketing/Footer';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F4F0E5] text-lernivox-forest selection:bg-lernivox-peach selection:text-lernivox-forest overflow-x-clip">
      <Navbar />

      {/* Main Page Body */}
      <main className="flex-1 w-full max-w-full overflow-x-clip">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

