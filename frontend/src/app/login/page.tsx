'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useAppState } from '@/components/providers/app-context';
import { maskIdentifier } from '@/lib/utils';
import { safeReturnPath } from '@/services/session';

export default function LoginPage() {
  const { login, isAuthenticated, hydrated } = useAppState();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [destination, setDestination] = useState('/dashboard');
  const [expiredNotice, setExpiredNotice] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDestination(safeReturnPath(params.get('next')));
    setExpiredNotice(params.get('reason') === 'expired');
  }, []);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      router.replace(safeReturnPath(params.get('next')));
    }
  }, [hydrated, isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setLoading(true);
    setError('');
    try {
      await login(identifier, password);
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#152238] overflow-hidden px-4 sm:px-6">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-[#F5A623]/10 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-3/4 w-3/4 rounded-full bg-[#FF6B4A]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        {/* Topo / Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="text-3xl font-black tracking-tight text-white drop-shadow-md">
            RS KITS
          </span>
        </div>

        {/* Formulário num Card Glassmorphism */}
        <div className="w-full rounded-3xl bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md border border-slate-700/50">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white">Bem-vindo</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {expiredNotice && (
              <p
                role="status"
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200"
              >
                Sua sessão expirou. Entre novamente para continuar.
              </p>
            )}
            <div className="space-y-1.5">
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(maskIdentifier(e.target.value))}
                placeholder="CPF, CNPJ ou e-mail"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20"
              />
            </div>

            <div className="space-y-1.5">
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-rose-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F5A623] to-[#FF6B4A] px-4 font-bold text-white transition-all hover:shadow-lg hover:shadow-[#FF6B4A]/30 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/50 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Acessar Painel
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
