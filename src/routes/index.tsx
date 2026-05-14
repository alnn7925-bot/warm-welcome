import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingCart, Printer, AlertTriangle, FileText, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaleDialog } from "@/components/SaleDialog";
import { useProducts } from "@/lib/data";
import { printLowStock, printFullInventory } from "@/lib/print";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [open, setOpen] = useState(false);
  const { products } = useProducts();
  const low = products.filter((p) => p.quantity <= 5);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-10 shadow-sm">
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl shadow-primary/30">
            <Store className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">مركز البدر</h1>
          <p className="mt-2 text-muted-foreground">نظام إدارة المبيعات والمخزن</p>
          <Button
            size="lg"
            onClick={() => setOpen(true)}
            className="mt-8 h-14 gap-3 px-10 text-base shadow-lg shadow-primary/20"
          >
            <ShoppingCart className="h-5 w-5" />
            بيع جديد
          </Button>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => printLowStock(products)}
          className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-6 text-right transition-all hover:border-amber-500/50 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">طباعة المنتجات القليلة والنافذة</div>
            <div className="text-sm text-muted-foreground">
              {low.length} منتج بحاجة إلى انتباه
            </div>
          </div>
          <Printer className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-x-1" />
        </button>

        <button
          onClick={() => printFullInventory(products)}
          className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-6 text-right transition-all hover:border-primary/50 hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">طباعة المخزن بالكامل</div>
            <div className="text-sm text-muted-foreground">
              جميع المنتجات مع أسعار البيع والشراء
            </div>
          </div>
          <Printer className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-x-1" />
        </button>
      </section>

      <SaleDialog open={open} onOpenChange={setOpen} />
    </main>
  );
}
