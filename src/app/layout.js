import "./globals.css";

export const metadata = {
  title: "Poultry Farm Management",
  description: "Manage your poultry farm operations efficiently",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}
