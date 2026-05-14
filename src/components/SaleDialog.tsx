import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts, createSale } from "@/lib/data";
import { fmtIQD } from "@/lib/types";
import { printInvoice } from "@/lib/print";
import { toast } from "sonner";
import { Banknote, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SaleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { products } = useProducts();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [pay, setPay] = useState<"cash" | "debt">("cash");
  const [busy, setBusy] = useState(false);

  const product = products.find((p) => p.id === productId);
  const total = product ? Math.round(product.salePrice * qty) : 0;

  function reset() {
    setName("");
    setPhone("");
    setProductId("");
    setQty(1);
    setPay("cash");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !productId || qty < 1) {
      toast.error("يرجى تعبئة جميع الحقول");
      return;
    }
    setBusy(true);
    try {
      const sale = await createSale({
        customerName: name.trim(),
        phone: phone.trim(),
        productId,
        quantity: qty,
        paymentType: pay,
      });
      toast.success("تمت عملية البيع");
      printInvoice(sale);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل البيع");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">عملية بيع جديدة</DialogTitle>
          <DialogDescription className="text-right">
            أدخل بيانات الزبون والمنتج المطلوب
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 text-right">
          <div className="space-y-2">
            <Label>اسم الزبون</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>رقم الهاتف</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
            />
          </div>
          <div className="space-y-2">
            <Label>المنتج</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر منتجاً" />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter((p) => p.quantity > 0)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {fmtIQD(p.salePrice)} (المتوفر: {p.quantity})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>الكمية</Label>
            <Input
              type="number"
              min={1}
              max={product?.quantity ?? undefined}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-2">
            <Label>طريقة البيع</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { v: "cash", label: "نقد", icon: Banknote },
                  { v: "debt", label: "دين", icon: CreditCard },
                ] as const
              ).map(({ v, label, icon: Icon }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPay(v)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                    pay === v
                      ? v === "cash"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/30",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">الإجمالي</span>
            <span className="text-lg font-bold">{fmtIQD(total)}</span>
          </div>

          <Button type="submit" className="w-full h-11" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            تأكيد البيع وطباعة الفاتورة
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}