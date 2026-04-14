import Link from "next/link";
import { NeoButton } from "@/components/ui/neo-button";
import { NeoCard } from "@/components/ui/neo-card";
import { Plus } from "lucide-react";
import Image from "next/image";
import { getDashboardData } from "@/app/actions/dashboard";
import { auth } from "@/auth";
import {
  startOfMonth,
  endOfMonth,
  subDays,
  startOfDay,
  endOfDay,
  parseISO,
  isValid,
} from "date-fns";
import { TransactionItem } from "@/components/transaction-item";
import { DashboardDateFilter } from "@/components/dashboard-date-filter";
import { formatCurrency } from "@/lib/utils";
import { DashboardCharts } from "@/components/dashboard-charts";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.filter || "month";
  let startDate: Date;
  let endDate: Date;

  const parseParamDate = (dateStr?: string, fallback: Date = new Date()) => {
    if (!dateStr) return fallback;
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? parsed : fallback;
  };

  switch (filter) {
    case "3days":
      startDate = startOfDay(subDays(new Date(), 2));
      endDate = endOfDay(new Date());
      break;
    case "week":
      startDate = startOfDay(subDays(new Date(), 6));
      endDate = endOfDay(new Date());
      break;
    case "month":
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
      break;
    case "custom":
      startDate = startOfDay(parseParamDate(sp.from, startOfMonth(new Date())));
      endDate = endOfDay(parseParamDate(sp.to, new Date()));
      break;
    default:
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
  }

  const session = await auth();
  const user = session?.user;
  const {
    recentTransactions,
    categoryStats,
    totalExpense,
  } = await getDashboardData(startDate, endDate, user?.id);

  return (
    <div className="flex flex-col min-h-screen pb-20 p-4 gap-3 bg-gradient-to-b from-background to-black">
      {/* Header */}
      <header className="flex justify-between items-center py-2">
        <div>
          <h1 className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1">
            Total Gastos
          </h1>
          <div className="flex flex-col">
            <span className="text-4xl font-black bg-gradient-to-r from-rose-400 via-red-400 to-rose-300 bg-clip-text text-transparent tracking-tighter">
              {formatCurrency(totalExpense)}
            </span>
          </div>
        </div>
        <Link href="/finance/profile">
          <NeoButton
            size="icon"
            variant="ghost"
            className="bg-white/5 border border-white/10 rounded-full w-12 h-12 overflow-hidden hover:scale-105 transition-transform shadow-lg shadow-black/20 p-0 relative group"
          >
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
            <Image
              src={
                user?.image ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "default"}`
              }
              alt="Profile"
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          </NeoButton>
        </Link>
      </header>

      {/* Date Filter */}
      <DashboardDateFilter />

      {/* Main Charts / Summary */}
      <DashboardCharts categoryStats={categoryStats} />

      {/* Recent Transactions */}
      <section className="flex flex-col gap-4 pb-32">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Actividad Reciente
          </h2>
          <Link
            href="/finance/transactions"
            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline underline-offset-4"
          >
            Ver todo
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground/50 text-[10px] font-black uppercase tracking-widest bg-white/5 rounded-3xl border border-dashed border-white/10">
            No hay transacciones
          </div>
        ) : (
          recentTransactions.slice(0, 5).map((t) => {
            return (
              <TransactionItem
                key={t.id}
                transaction={
                  t as unknown as Parameters<
                    typeof TransactionItem
                  >[0]["transaction"]
                }
              />
            );
          })
        )}
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <Link href="/finance/transactions/new">
          <NeoButton
            size="icon"
            className="h-16 w-16 rounded-full shadow-2xl shadow-emerald-500/40 bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-none"
          >
            <Plus className="w-10 h-10" />
          </NeoButton>
        </Link>
      </div>
    </div>
  );
}
