import { auth, signOut } from "@/auth";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { ArrowLeft, LogOut, Landmark, Tags, ChevronRight, Car } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteAccountButton } from "@/components/delete-account-button";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center gap-12 w-full max-w-md mx-auto relative pb-20 pt-12">
      <div className="w-full flex justify-start">
        <Link href="/finance">
          <NeoButton
            variant="secondary"
            className="gap-1.5 h-9 px-3 rounded-xl shadow-sm border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </NeoButton>
        </Link>
      </div>

      <div className="flex flex-col items-center gap-6 w-full">
        <div className="relative">
          <div className="w-28 h-28 rounded-full border-2 border-primary/10 p-1.5 bg-background/50 backdrop-blur-sm shadow-xl">
            <div className="w-full h-full rounded-full overflow-hidden bg-muted flex items-center justify-center border border-white/5">
              <Image
                src={
                  user.image ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                }
                alt="Avatar"
                width={112}
                height={112}
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-3xl font-black italic tracking-tighter text-foreground">
            {user.name || "Usuario Veco"}
          </h2>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
            {user.email}
          </p>
        </div>
      </div>

      <div className="w-full space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 pl-2">
          Configuración
        </h3>
        <Link href="/finance/accounts" className="block">
          <NeoCard className="p-4 flex items-center justify-between hover:bg-white/5 active:scale-[0.98] transition-all border-white/5 bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm tracking-tight uppercase">
                Cuentas
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </NeoCard>
        </Link>
        <Link href="/finance/categories" className="block">
          <NeoCard className="p-4 flex items-center justify-between hover:bg-white/5 active:scale-[0.98] transition-all border-white/5 bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Tags className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm tracking-tight uppercase">
                Categorías
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </NeoCard>
        </Link>
        <Link href="/finance/vehicles" className="block">
          <NeoCard className="p-4 flex items-center justify-between hover:bg-white/5 active:scale-[0.98] transition-all border-white/5 bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm tracking-tight uppercase">
                Vehículos
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </NeoCard>
        </Link>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <form
          className="w-full"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <NeoButton
            variant="secondary"
            className="w-full h-14 font-black uppercase tracking-widest text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 text-[10px] rounded-2xl"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </NeoButton>
        </form>

        <DeleteAccountButton 
          isDemo={user.id === "clx-demo-user-id-veco" || user.email === "contacto@minube.dev"} 
        />

        <div className="flex justify-center pt-2">
          <a 
            href="https://github.com/jorgelopez21/veco"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:text-emerald-400 transition-all select-none bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10"
          >
            Veco v0.4.0
          </a>
        </div>
      </div>
    </div>
  );
}
