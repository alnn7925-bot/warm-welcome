import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, Phone, Loader2, HandCoins, FileText, Printer, Trash2 } from "lucide-react";
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
import { useCustomers, useSales, usePayments, payDebt, deleteCustomer } from "@/lib/data";
import { fmtIQD } from "@/lib/types";
import type { Customer } from "@/lib/types";
import type { Sale, Payment } from "@/lib/types";
import { toast } from "sonner";
import { printCustomerStatement } from "@/lib/print";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [{ title: "الزبائن — مركز البدر" }],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { customers } = useCustomers();
  const sales = useSales();
  const payments = usePayments();
  const [paying, setPaying] = useState<Customer | null>(null);
  const [statement, setStatement] = useState<Customer | null>(null);

  const sorted = [...customers].sort(
    (a, b) => (b.totalDebt || 0) - (a.totalDebt || 0),
  );
  const totalDebt = customers.reduce(
    (s, c) => s + Math.max(0, Math.round(c.totalDebt || 0)),
    0,
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الزبائن</h1>
          <p className="text-sm text-muted-foreground">
            {customers.length} زبون
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card px-5 py-3 text-right">
          <div className="text-xs text-muted-foreground">إجمالي الديون</div>
          <div className="text-lg font-bold text-red-600">{fmtIQD(totalDebt)}</div>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <Users className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">لا يوجد زبائن بعد</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c) => {
            const debt = Math.max(0, Math.round(c.totalDebt || 0));
            const hasDebt = debt > 0;
            return (
              <div
                key={c.id}
                className={
                  "rounded-2xl border-2 bg-card p-5 transition-all hover:shadow-md " +
                  (hasDebt ? "border-red-300/70" : "border-emerald-300/70")
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {c.phone}
                    </div>
                  </div>
                  <span
                    className={
                      "rounded-full px-3 py-1 text-[11px] font-bold " +
                      (hasDebt
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700")
                    }
                  >
                    {hasDebt ? "عليه دين" : "مسدد"}
                  </span>
                </div>

                <div
                  className={
                    "mt-4 rounded-xl px-4 py-3 " +
                    (hasDebt ? "bg-red-50" : "bg-emerald-50")
                  }
                >
                  <div className="text-xs text-muted-foreground">المبلغ المستحق</div>
                  <div
                    className={
                      "mt-1 text-xl font-bold " +
                      (hasDebt ? "text-red-700" : "text-emerald-700")
                    }
                  >
                    {fmtIQD(debt)}
                  </div>
                </div>

                {hasDebt && (
                  <Button
                    className="mt-3 w-full gap-2"
                    variant="outline"
                    onClick={() => setPaying(c)}
                  >
                    <HandCoins className="h-4 w-4" />
                    تسديد دفعة
                  </Button>
                )}
                <Button
                  className="mt-2 w-full gap-2"
                  variant="secondary"
                  onClick={() => setStatement(c)}
                >
                  <FileText className="h-4 w-4" />
                  كشف الحساب
                </Button>
                <Button
                  className="mt-2 w-full gap-2"
                  variant="ghost"
                  onClick={async () => {
                    if (
                      confirm(
                        hasDebt
                          ? `الزبون "${c.name}" عليه دين ${fmtIQD(debt)}. هل تريد حذفه نهائياً؟`
                          : `حذف الزبون "${c.name}" نهائياً؟`,
                      )
                    ) {
                      try {
                        await deleteCustomer(c.id);
                        toast.success("تم حذف الزبون");
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "فشل الحذف",
                        );
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">حذف الزبون</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <PayDialog customer={paying} onClose={() => setPaying(null)} />
      <StatementDialog
        customer={statement}
        sales={sales}
        payments={payments}
        onClose={() => setStatement(null)}
      />
    </main>
  );
}

function PayDialog({
  customer,
  onClose,
}: {
  customer: Customer | null;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);

  function handleOpenChange(v: boolean) {
    if (v) setAmount(0);
    if (!v) onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;
    const amt = Math.round(amount);
    if (amt <= 0) {
      toast.error("أدخل مبلغاً صحيحاً");
      return;
    }
    if (amt > Math.round(customer.totalDebt)) {
      toast.error("المبلغ أكبر من الدين");
      return;
    }
    setBusy(true);
    try {
      await payDebt(customer.id, amt);
      toast.success("تم تسديد الدفعة");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل التسديد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!customer} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">تسديد دفعة</DialogTitle>
          <DialogDescription className="text-right">
            {customer?.name} — الدين الحالي:{" "}
            <b className="text-red-600">
              {customer ? fmtIQD(Math.round(customer.totalDebt)) : ""}
            </b>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 text-right">
          <div className="space-y-2">
            <Label>المبلغ المسدد (دينار عراقي)</Label>
            <Input
              type="number"
              min={1}
              max={customer ? Math.round(customer.totalDebt) : undefined}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">الدين المتبقي</span>
            <span className="text-lg font-bold">
              {customer
                ? fmtIQD(Math.max(0, Math.round(customer.totalDebt) - Math.round(amount)))
                : ""}
            </span>
          </div>
          <Button type="submit" className="w-full h-11" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            تأكيد التسديد
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatementDialog({
  customer,
  sales,
  payments,
  onClose,
}: {
  customer: Customer | null;
  sales: Sale[];
  payments: Payment[];
  onClose: () => void;
}) {
  if (!customer) {
    return (
      <Dialog open={false} onOpenChange={() => onClose()}>
        <DialogContent />
      </Dialog>
    );
  }
  const cSales = sales
    .filter((s) => s.phone === customer.phone)
    .sort((a, b) => a.createdAt - b.createdAt);
  const cPayments = payments
    .filter((p) => p.customerId === customer.id)
    .sort((a, b) => a.createdAt - b.createdAt);

  const totalQty = cSales.reduce((s, x) => s + x.quantity, 0);
  const totalSales = cSales.reduce((s, x) => s + x.total, 0);
  const totalCash = cSales
    .filter((x) => x.paymentType === "cash")
    .reduce((s, x) => s + x.total, 0);
  const totalDebtSales = cSales
    .filter((x) => x.paymentType === "debt")
    .reduce((s, x) => s + x.total, 0);
  const totalPaid = cPayments.reduce((s, x) => s + x.amount, 0);
  const remaining = Math.max(0, Math.round(customer.totalDebt || 0));
  const fmtDate = (t: number) => new Date(t).toLocaleString("ar-IQ");

  return (
    <Dialog open={!!customer} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="text-right">
              <DialogTitle>كشف حساب — {customer.name}</DialogTitle>
              <DialogDescription>
                {customer.phone} • {cSales.length} فاتورة • {totalQty} قطعة
              </DialogDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => printCustomerStatement(customer, cSales, cPayments)}
            >
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 text-right">
          <div>
            <h3 className="mb-2 font-semibold">المشتريات</h3>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">التاريخ</th>
                    <th className="p-2">المنتج</th>
                    <th className="p-2">الكمية</th>
                    <th className="p-2">سعر الوحدة</th>
                    <th className="p-2">الإجمالي</th>
                    <th className="p-2">الدفع</th>
                  </tr>
                </thead>
                <tbody>
                  {cSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-muted-foreground">
                        لا توجد مشتريات
                      </td>
                    </tr>
                  ) : (
                    cSales.map((s, i) => (
                      <tr key={s.id} className="border-t">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{fmtDate(s.createdAt)}</td>
                        <td className="p-2 font-medium">{s.productName}</td>
                        <td className="p-2">{s.quantity}</td>
                        <td className="p-2">{fmtIQD(s.unitPrice)}</td>
                        <td className="p-2 font-bold">{fmtIQD(s.total)}</td>
                        <td className="p-2">
                          <span
                            className={
                              "rounded-full px-2 py-0.5 text-[11px] font-bold " +
                              (s.paymentType === "cash"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700")
                            }
                          >
                            {s.paymentType === "cash" ? "نقد" : "أجل"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {cSales.length > 0 && (
                  <tfoot className="bg-muted/30 font-bold">
                    <tr className="border-t">
                      <td className="p-2" colSpan={3}>
                        الإجماليات
                      </td>
                      <td className="p-2">{totalQty}</td>
                      <td className="p-2"></td>
                      <td className="p-2">{fmtIQD(totalSales)}</td>
                      <td className="p-2"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">التسديدات</h3>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">التاريخ</th>
                    <th className="p-2">المبلغ المسدد</th>
                  </tr>
                </thead>
                <tbody>
                  {cPayments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-muted-foreground">
                        لا توجد تسديدات
                      </td>
                    </tr>
                  ) : (
                    cPayments.map((p, i) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2">{fmtDate(p.createdAt)}</td>
                        <td className="p-2 font-bold text-emerald-700">
                          {fmtIQD(p.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {cPayments.length > 0 && (
                  <tfoot className="bg-muted/30 font-bold">
                    <tr className="border-t">
                      <td className="p-2" colSpan={2}>
                        الإجمالي
                      </td>
                      <td className="p-2">{fmtIQD(totalPaid)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryBox label="إجمالي المبيعات" value={fmtIQD(totalSales)} />
            <SummaryBox label="مدفوع نقداً" value={fmtIQD(totalCash)} tone="ok" />
            <SummaryBox label="مباع بالأجل" value={fmtIQD(totalDebtSales)} />
            <SummaryBox label="إجمالي التسديدات" value={fmtIQD(totalPaid)} tone="ok" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-foreground px-5 py-4 text-background">
            <span className="font-semibold">الدين المتبقي</span>
            <span className="text-xl font-bold">{fmtIQD(remaining)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok";
}) {
  return (
    <div className="rounded-xl border bg-card p-3 text-right">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={
          "mt-1 text-base font-bold " + (tone === "ok" ? "text-emerald-700" : "")
        }
      >
        {value}
      </div>
    </div>
  );
}