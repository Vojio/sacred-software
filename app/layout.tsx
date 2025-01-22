import Providers from '@components/Providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-DE">
      <body className="theme-black-pink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
