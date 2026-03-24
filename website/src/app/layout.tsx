import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ChurchProvider } from '../context/ChurchContext';
import AuthRouteGate from '../components/AuthRouteGate';

export const metadata: Metadata = {
  title: 'PrayLoom',
  description: 'Premium white-label church operations platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthRouteGate />
          <ChurchProvider>{children}</ChurchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
