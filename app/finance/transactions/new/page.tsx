import { getTransactionFormData } from "@/app/actions/transactions";
import { TransactionForm } from "./form";
import { auth } from "@/auth";

export default async function NewTransactionPage() {
  const session = await auth();
  const userId = session?.user?.id;
  
  // Fetch data on the server for instant loading with explicit userId
  const data = await getTransactionFormData(undefined, userId);

  return (
    <TransactionForm
      categories={data.categories}
      recentIds={data.recentIds}
      recentAccountIds={data.recentAccountIds}
      accounts={data.accounts}
      evStats={data.evStats}
      vehicles={data.vehicles as { id: string; brand: string; model: string; batteryCapacity: number; degradation: number }[]}
      lastOdo={data.lastOdo}
    />
  );
}
