import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Package, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/data";
import { fmtIQD } from "@/lib/types";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

/** Normalize text for search: lowercase, strip whitespace/tashkeel,
 *  unify Arabic letter variants and Arabic-Indic digits. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "") // tashkeel
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\s+/g, "");
}

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [{ title: "المخزن — مركز البدر" }],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { products } = useProducts();
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");

  const term = normalize(search);
  const filtered = useMemo(
    () =>
      term ? products.filter((p) => normalize(p.name).includes(term)) : products,
    [products, term],
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المخزن</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} منتج
          </p>
        </div>
        <Button onClick={() => setAdding(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة منتج
        </Button>
      </div>

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن منتج بالاسم..."
          className="h-11 pr-10 text-right"
        />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <Package className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">لا توجد منتجات بعد</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <Search className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">
            لا توجد نتائج لـ "{search}"
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const low = p.quantity <= 5;
            const out = p.quantity === 0;
            return (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{p.name}</h3>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[11px] font-bold " +
                      (out
                        ? "bg-red-100 text-red-700"
                        : low
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700")
                    }
                  >
                    {out ? "نافذ" : low ? "قليل" : "متوفر"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <div className="text-muted-foreground">الكمية</div>
                    <div className="mt-1 font-bold">{p.quantity}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <div className="text-muted-foreground">شراء</div>
                    <div className="mt-1 font-bold">{fmtIQD(p.purchasePrice)}</div>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2 text-center">
                    <div className="text-primary/80">بيع</div>
                    <div className="mt-1 font-bold text-primary">
                      {fmtIQD(p.salePrice)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() => setEditing(p)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={async () => {
                      if (confirm(`حذف المنتج "${p.name}"؟`)) {
                        await deleteProduct(p.id);
                        toast.success("تم الحذف");
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProductDialog
        open={adding}
        onOpenChange={setAdding}
        title="إضافة منتج جديد"
        onSubmit={async (data) => {
          await addProduct(data);
          toast.success("تمت إضافة المنتج");
        }}
      />
      <ProductDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title="تعديل المنتج"
        initial={editing ?? undefined}
        onSubmit={async (data) => {
          if (editing) await updateProduct(editing.id, data);
          toast.success("تم الحفظ");
          setEditing(null);
        }}
      />
    </main>
  );
}

function ProductDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  initial?: Product;
  onSubmit: (data: Omit<Product, "id">) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [purchase, setPurchase] = useState(initial?.purchasePrice ?? 0);
  const [sale, setSale] = useState(initial?.salePrice ?? 0);
  const [qty, setQty] = useState(initial?.quantity ?? 0);
  const [busy, setBusy] = useState(false);

  // Sync fields whenever the dialog opens or the edited product changes
  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setPurchase(initial?.purchasePrice ?? 0);
      setSale(initial?.salePrice ?? 0);
      setQty(initial?.quantity ?? 0);
    }
  }, [open, initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("الاسم مطلوب");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        purchasePrice: Math.max(0, Math.round(purchase)),
        salePrice: Math.max(0, Math.round(sale)),
        quantity: Math.max(0, Math.round(qty)),
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">{title}</DialogTitle>
          <DialogDescription className="text-right">
            أدخل بيانات المنتج
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 text-right">
          <div className="space-y-2">
            <Label>اسم المنتج</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>سعر الشراء</Label>
              <Input
                type="number"
                min={0}
                value={purchase}
                onChange={(e) => setPurchase(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>سعر البيع</Label>
              <Input
                type="number"
                min={0}
                value={sale}
                onChange={(e) => setSale(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>الكمية</Label>
            <Input
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value) || 0)}
            />
          </div>
          <Button type="submit" className="w-full h-11" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}