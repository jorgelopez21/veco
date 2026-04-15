import { getTransactionFormData } from "@/app/actions/transactions";
import { EditTransactionForm } from "./edit-form";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch all data on the server in parallel with explicit userId
  const data = await getTransactionFormData(id, userId);

  if (!data.transaction) {
    redirect("/finance");
  }

  return (
    <EditTransactionForm
      id={id}
      transaction={data.transaction}
      categories={data.categories}
      recentIds={data.recentIds}
      recentAccountIds={data.recentAccountIds}
      accounts={data.accounts}
      vehicles={data.vehicles}
      evStats={data.evStats}
    />
  );
}
