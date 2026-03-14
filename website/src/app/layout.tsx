import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ChurchProvider } from '../context/ChurchContext';

export const metadata: Metadata = {
  title: 'Sunday School Attendance Manager',
  description: 'Real-time attendance management for Sunday School classes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ChurchProvider>{children}</ChurchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
