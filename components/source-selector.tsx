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
    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-2 pt-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent custom-scrollbar">
      {accounts.map((account) => (
        <NeoButton
          key={account.id}
          type="button"
          size="lg"
          variant={selectedAccountId === account.id ? "primary" : "secondary"}
          onClick={() => {
            onAccountChange(account.id);
          }}
          className={cn(
            "h-16 px-4 text-xs font-black rounded-2xl flex flex-col items-center justify-center text-center uppercase tracking-tighter leading-tight transition-all",
            selectedAccountId === account.id 
              ? "shadow-[0_10px_20px_-5px_rgba(255,255,255,0.1)] scale-[1.02] border-primary" 
              : "opacity-70 hover:opacity-100 bg-white/5 border-white/5",
          )}
        >
          {account.name}
        </NeoButton>
      ))}
    </div>
  );
}



