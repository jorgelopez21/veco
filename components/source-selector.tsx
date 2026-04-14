import { cn } from "@/lib/utils";
import { NeoButton } from "@/components/ui/neo-button";

interface SourceSelectorProps {
  accounts: { id: string; name: string }[];
  selectedAccountId?: string;
  onAccountChange: (id: string) => void;
}

export function SourceSelector({
  accounts,
  selectedAccountId,
  onAccountChange,
}: SourceSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {accounts.map((account) => (
        <NeoButton
          key={account.id}
          type="button"
          size="sm"
          variant={selectedAccountId === account.id ? "primary" : "secondary"}
          onClick={() => {
            onAccountChange(account.id);
          }}
          className={cn(
            "h-11 px-5 text-sm font-black rounded-2xl flex-1 min-w-[100px] uppercase tracking-tight",
            selectedAccountId === account.id ? "shadow-lg scale-[1.02]" : "opacity-60",
          )}
        >
          {account.name}
        </NeoButton>
      ))}
    </div>
  );
}
