export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sin estilos propios — cada página auth maneja su propio fondo y centrado
  return <>{children}</>;
}
