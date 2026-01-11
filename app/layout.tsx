// Root layout - minimal wrapper for i18n
// Actual styling and metadata are in [locale]/layout.tsx

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
