import { getEVStatsInRange } from "@/app/actions/transactions";
import { getVehicles } from "@/app/actions/vehicles";
import { EVStatsClient } from "./ev-stats-client";
import { NeoButton } from "@/components/ui/neo-button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { startOfMonth, endOfMonth } from "date-fns";
import { auth } from "@/auth";

export default async function EVStatsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const vehicles = await getVehicles(userId);
  
  // Vehicles are already serialized by the action
  const initialStats = await getEVStatsInRange(
    startOfMonth(new Date()),
    endOfMonth(new Date()),
    vehicles[0]?.id,
    userId
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 pb-24 w-full">
      {/* Header */}
      <header className="flex items-center gap-4 mb-6">
        <Link href="/finance">
          <NeoButton
            variant="secondary"
            className="w-10 h-10 p-0 rounded-2xl bg-white/5 border-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </NeoButton>
        </Link>
        <h1 className="text-xl font-black italic tracking-tighter uppercase">
          Eficacia Energética
        </h1>
      </header>

      <EVStatsClient vehicles={vehicles as { id: string; brand: string; model: string; batteryCapacity: number; degradation: number }[]} initialStats={initialStats} />
    </div>
  );
}
