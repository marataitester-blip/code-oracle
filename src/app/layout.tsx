import "./globals.css"; // Подключает стили Tailwind (если файл есть)

export const metadata = {
  title: "Code-Oracle",
  description: "Облачная Web-IDE и помощник",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
