"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { AlertCircle } from "lucide-react";
import Image from "next/image";

import { Suspense, useState, useTransition } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { validateTurnstileAction } from "@/app/actions/auth";

const IS_DEV = process.env.NODE_ENV === "development";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const isTurnstileEnabled = process.env.NEXT_PUBLIC_ENABLE_TURNSTILE !== "false" && !!siteKey;

  const handleLogin = async () => {
    if (isTurnstileEnabled && !turnstileToken) return;

    setServerError(null);

    startTransition(async () => {
      if (isTurnstileEnabled) {
        const result = await validateTurnstileAction(turnstileToken);
        if (!result.success) {
          setServerError(result.error || "Error de seguridad");
          return;
        }
      }
      
      // Si pasa la validación del servidor (o si está deshabilitado), procedemos
      await signIn("google", { callbackUrl: "/" });
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-black">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-40 h-40 rounded-full border border-white/5 bg-white/5 flex items-center justify-center shadow-2xl backdrop-blur-md relative overflow-hidden group">
            <Image
              src="/logo-veco-colombia.png"
              alt="VECO Logo"
              fill
              priority
              className="relative z-10 object-cover brightness-110 drop-shadow-[0_0_25px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black tracking-tighter text-white">VECO</h1>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em]">
              Vehículos Eléctricos
            </p>
            <p className="text-[10px] font-black text-white/80 uppercase tracking-widest leading-relaxed">
              de Colombia
            </p>
          </div>
        </div>

        <NeoCard className="p-8 border-white/5 bg-white/5 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

          <div className="space-y-6 relative z-10">
            {error === "capacity_reached" ? (
              <div className="space-y-4 text-center animate-in zoom-in-95 duration-300">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-black tracking-tighter text-amber-500 uppercase italic">
                    Servidor Lleno
                  </h2>
                  <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                    El servidor de demostración ha alcanzado su límite máximo de 50 usuarios. 
                    El sistema limpiará cuentas inactivas pronto. Si necesitas acceso prioritario, contacta al administrador o descarga el código para tu propia instancia:
                  </p>
                  <div className="flex flex-col gap-3 pt-2">
                    <a
                      href="mailto:contacto@minube.dev"
                      className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline transition-all"
                    >
                      contacto@minube.dev
                    </a>
                    <a
                      href="https://github.com/jorgelopez21/veco"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      Ver en GitHub
                    </a>
                  </div>
                </div>
                <NeoButton
                  onClick={() => (window.location.href = "/login")}
                  className="w-full h-10 bg-white/5 border border-white/10 text-white text-[9px] font-bold uppercase tracking-widest mt-4"
                >
                  Reintentar acceso
                </NeoButton>
              </div>
            ) : error === "unauthorized" ? (
              <div className="space-y-4 text-center animate-in zoom-in-95 duration-300">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <AlertCircle className="w-6 h-6 text-rose-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-black tracking-tighter text-rose-500 uppercase italic">
                    Acceso Denegado
                  </h2>
                  <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                    Lo sentimos, tu cuenta no tiene permisos para acceder a esta
                    infraestructura. Para solicitar acceso, contacta con el
                    administrador:
                  </p>
                  <div className="pt-2">
                    <a
                      href="mailto:contacto@minube.dev"
                      className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline transition-all"
                    >
                      contacto@minube.dev
                    </a>
                  </div>
                </div>
                <NeoButton
                  onClick={() => (window.location.href = "/login")}
                  className="w-full h-10 bg-white/5 border border-white/10 text-white text-[9px] font-bold uppercase tracking-widest mt-4"
                >
                  Reintentar con otra cuenta
                </NeoButton>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {isTurnstileEnabled && (
                    <div className="flex justify-center py-2 animate-in fade-in duration-700">
                      <Turnstile
                        siteKey={siteKey}
                        onSuccess={(token) => setTurnstileToken(token)}
                        options={{
                          theme: "dark",
                        }}
                      />
                    </div>
                  )}

                  {serverError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-tight">
                        {serverError}
                      </p>
                    </div>
                  )}

                  <NeoButton
                    onClick={handleLogin}
                    disabled={(isTurnstileEnabled && !turnstileToken) || isPending}
                    className="w-full h-12 bg-transparent border border-white/10 text-white hover:bg-white/5 shadow-none text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                  >
                    <svg
                      className="w-4 h-4 grayscale opacity-80"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#fff"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#fff"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.24.81-.6z"
                        fill="#fff"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#fff"
                      />
                    </svg>
                    Google
                  </NeoButton>

                  {IS_DEV && process.env.NEXT_PUBLIC_ALLOW_DEV_BYPASS === "true" && (
                    <div className="flex flex-col gap-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-500">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-amber-500 uppercase tracking-tight">
                            Bypass de Desarrollador
                          </p>
                          <p className="text-[8px] text-amber-100/80 leading-tight">
                            Solo para ambientes locales. No requiere Google OAuth.
                          </p>
                        </div>
                      </div>
                      <NeoButton
                        onClick={() =>
                          signIn("dev-login", { callbackUrl: "/" })
                        }
                        className="w-full h-10 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 text-[9px] font-bold uppercase tracking-widest transition-all"
                      >
                        Iniciar como Desarrollador
                      </NeoButton>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </NeoCard>
      </div>
      
      <div className="mt-8 flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
        <a 
          href="https://github.com/jorgelopez21/veco"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-primary transition-all select-none bg-white/10 px-6 py-2 rounded-full border border-white/10 shadow-lg shadow-black/50"
        >
          Veco v0.4.0
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginContent />
    </Suspense>
  );
}
