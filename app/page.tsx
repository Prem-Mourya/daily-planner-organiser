import { Card } from "@/components/ui/Card";

export default function Home() {
  return (
    <main className="py-8">
      <Card>
        <h1 className="text-lg font-semibold text-black">Today</h1>
        <p className="mt-2 text-sm text-black/50">
          Your daily habit dashboard will live here.
        </p>
      </Card>
    </main>
  );
}
