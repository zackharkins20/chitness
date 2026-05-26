import { BottomNav } from "@/components/BottomNav";
import { KeyboardDoneBar } from "@/components/KeyboardDoneBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col pb-20">
      {children}
      <KeyboardDoneBar />
      <BottomNav />
    </div>
  );
}
