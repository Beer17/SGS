'use client';
// src/app/(auth)/login/page.tsx
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (!res || res.error) {
        setError('Credenciales incorrectas o cuenta desactivada.');
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('Error de conexión. Verifica tu red.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper p-6">
      <div className="w-full max-w-md rounded-2xl border border-[#e2e9df] bg-white p-8 shadow-soft">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-moss font-bold text-white">S</div>
          <div className="font-display text-xl font-bold">SISAS <span className="text-clay">ANSI</span></div>
        </div>

        <h1 className="font-display text-2xl font-bold">Bienvenido de vuelta</h1>
        <p className="mt-2 text-sm text-[#718078]">Accede al panel de administración scout.</p>

        {error && (
          <div role="alert" className="mt-4 rounded-lg bg-[#fdecea] px-4 py-3 text-sm font-semibold text-clay">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
          <label className="block text-sm font-bold">
            Correo electrónico
            <input
              required type="email" name="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@asociacion.org"
              className="mt-2 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss"
            />
          </label>
          <label className="block text-sm font-bold">
            Contraseña
            <input
              required minLength={8} type="password" name="password" autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-lg border border-[#dfe7dc] p-3 text-sm outline-none focus:border-moss"
            />
          </label>
          <button
            type="submit" disabled={loading}
            className="block w-full rounded-lg bg-moss py-3 text-center text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Ingresando…' : 'Ingresar al panel'}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-paper p-4 text-xs text-[#5c6f63]">
          <p className="font-bold uppercase tracking-wide text-[#829087]">Cuentas de demostración</p>
          <ul className="mt-2 space-y-1 font-mono">
            <li>admin@gmail.com · admin1234 <span className="text-moss">(Admin)</span></li>
            <li>jefe@sisas.ansi · Jefe2026! <span className="text-moss">(Jefe de grupo)</span></li>
            <li>scouter@sisas.ansi · Scouter2026! <span className="text-moss">(Scouter)</span></li>
            <li>tutor@sisas.ansi · Tutor2026! <span className="text-moss">(Padre/Tutor)</span></li>
          </ul>
        </div>

        <p className="mt-4 text-center text-xs text-[#829087]">
          ¿Aún no tienes acceso?{' '}
          <Link href="/register" className="font-bold text-moss">Solicítalo aquí</Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
