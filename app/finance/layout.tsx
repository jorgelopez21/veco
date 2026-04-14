import { BottomNav } from "@/components/bottom-nav";
import Image from "next/image";
import Link from "next/link";

export default function FinanceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Global VECO Header */}
      <header className="sticky top-0 z-50 flex items-center justify-center py-3 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link href="/finance" className="flex items-center group cursor-pointer">
            <Image 
              src="/logo-veco-colombia.png" 
              alt="VECO Logo" 
              width={48} 
              height={48} 
              className="rounded-full drop-shadow-[0_0_12px_rgba(16,185,129,0.5)] group-hover:scale-110 transition-transform" 
            />
          </Link>
          <a 
            href="https://github.com/jorgelopez21/veco" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-black tracking-tight text-white hover:text-emerald-400 transition-colors uppercase"
          >
            VECO
          </a>
        </div>
      </header>
      {children}
      <BottomNav />
    </>
  );
}
