import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-black">No encontramos esta página</h1>
      <p>El enlace no existe o ya no está disponible.</p>
      <Link href="/">Volver al inicio</Link>
    </main>
  );
}
