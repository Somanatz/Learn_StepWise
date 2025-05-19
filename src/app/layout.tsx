import type { Metadata } from 'next';
import { Poppins, Open_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import { AuthProvider } from '@/context/AuthContext';
import ContactSalesForm from '@/components/shared/ContactSalesForm';

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700', '800'], 
});

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'GenAI-Campus | Personalized Learning Platform', // Updated title
  description: 'GenAI-Campus - Adaptive learning with smart notes, progress tracking, and AI-powered insights.', // Updated description
  icons: {
    // Add a placeholder or remove if no actual icon file is generated
    // icon: "/favicon.ico", 
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${openSans.variable} ${poppins.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <AuthProvider>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster />
          <footer className="bg-secondary text-secondary-foreground py-10 border-t">
            <div className="container mx-auto px-4 text-center">
              <h3 className="text-xl font-semibold mb-2 text-secondary-foreground">GenAI-Campus</h3>
              <p className="text-sm text-secondary-foreground/80 mb-4 max-w-md mx-auto">
                Empowering students, supporting teachers, and engaging parents with our innovative learning platform.
              </p>
              <p className="text-sm text-secondary-foreground/80">&copy; {new Date().getFullYear()} GenAI-Campus. All rights reserved.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
