import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-black text-[#001F54]">No encontramos esta página</h1>
      <p className="text-slate-600 font-semibold max-w-md">
        El enlace no existe o la página se movió. Volvé al inicio o mirá las competencias.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="bg-[#001F54] text-white font-bold py-3 px-5 rounded-lg">Inicio</Link>
        <Link href="/torneos" className="bg-[#F97316] text-[#001F54] font-bold py-3 px-5 rounded-lg">Competencias</Link>
      </div>
    </main>
  );
}
