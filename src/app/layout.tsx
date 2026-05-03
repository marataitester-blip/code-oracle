import "./globals.css";

export const metadata = {
  title: "Code-Oracle | IDE",
  description: "Персональный облачный инструмент разработки",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="antialiased selection:bg-purple-500/30">
        {children}
      </body>
    </html>
  );
}
