export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-16"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 60%)",
      }}
    >
      {children}
    </div>
  );
}
