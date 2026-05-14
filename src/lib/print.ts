import type { Customer, Payment, Product, Sale } from "./types";
import { fmtIQD } from "./types";

function openPrint(title: string, body: string) {
  const w = window.open("", "_blank", "width=820,height=900");
  if (!w) return;
  w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>${title}</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;padding:32px;color:#0f172a;margin:0}
      .head{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:14px;margin-bottom:20px}
      .brand{font-size:26px;font-weight:800;letter-spacing:.5px}
      .sub{color:#64748b;font-size:13px}
      h2{margin:0 0 12px;font-size:18px}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}
      th,td{padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right}
      th{background:#f8fafc;font-weight:700}
      tfoot td{font-weight:700;background:#f1f5f9}
      .info{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#f8fafc;padding:14px;border-radius:10px;font-size:14px}
      .info b{color:#0f172a}
      .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700}
      .cash{background:#dcfce7;color:#166534}
      .debt{background:#fee2e2;color:#991b1b}
      .total{margin-top:16px;display:flex;justify-content:space-between;align-items:center;background:#0f172a;color:white;padding:14px 18px;border-radius:10px;font-size:18px;font-weight:700}
      .footer{margin-top:30px;text-align:center;color:#64748b;font-size:12px;border-top:1px dashed #cbd5e1;padding-top:12px}
      @media print{body{padding:14px}}
    </style></head><body>${body}<div class="footer">شكراً لتعاملكم مع مركز البدر</div>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`);
  w.document.close();
}

function header(title: string) {
  return `<div class="head">
    <div><div class="brand">مركز البدر</div><div class="sub">${title}</div></div>
    <div class="sub">${new Date().toLocaleString("ar-IQ")}</div>
  </div>`;
}

export function printInvoice(sale: Sale) {
  const body = `${header("فاتورة بيع")}
  <div class="info">
    <div><b>اسم الزبون:</b> ${sale.customerName}</div>
    <div><b>رقم الهاتف:</b> ${sale.phone}</div>
    <div><b>رقم الفاتورة:</b> ${sale.id.slice(0, 8).toUpperCase()}</div>
    <div><b>طريقة الدفع:</b> <span class="badge ${sale.paymentType === "cash" ? "cash" : "debt"}">${sale.paymentType === "cash" ? "نقد" : "دين"}</span></div>
  </div>
  <table>
    <thead><tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
    <tbody><tr>
      <td>${sale.productName}</td>
      <td>${sale.quantity}</td>
      <td>${fmtIQD(sale.unitPrice)}</td>
      <td>${fmtIQD(sale.total)}</td>
    </tr></tbody>
  </table>
  <div class="total"><span>المبلغ الإجمالي</span><span>${fmtIQD(sale.total)}</span></div>`;
  openPrint("فاتورة", body);
}

export function printLowStock(products: Product[]) {
  const low = products.filter((p) => p.quantity <= 5);
  const rows = low
    .map(
      (p) => `<tr>
        <td>${p.name}</td>
        <td>${p.quantity}</td>
        <td>${p.quantity === 0 ? '<span class="badge debt">نافذ</span>' : '<span class="badge" style="background:#fef3c7;color:#92400e">قليل</span>'}</td>
      </tr>`,
    )
    .join("");
  const body = `${header("المنتجات القليلة والنافذة")}
    <table><thead><tr><th>المنتج</th><th>الكمية المتبقية</th><th>الحالة</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#64748b;padding:20px">لا توجد منتجات قليلة</td></tr>'}</tbody></table>`;
  openPrint("منتجات قليلة ونافذة", body);
}

export function printFullInventory(products: Product[]) {
  let totalBuy = 0;
  let totalSell = 0;
  const rows = products
    .map((p) => {
      const buy = Math.round(p.purchasePrice * p.quantity);
      const sell = Math.round(p.salePrice * p.quantity);
      totalBuy += buy;
      totalSell += sell;
      return `<tr>
        <td>${p.name}</td>
        <td>${p.quantity}</td>
        <td>${fmtIQD(p.purchasePrice)}</td>
        <td>${fmtIQD(p.salePrice)}</td>
        <td>${fmtIQD(buy)}</td>
        <td>${fmtIQD(sell)}</td>
      </tr>`;
    })
    .join("");
  const body = `${header("تقرير المخزن الكامل")}
    <table>
      <thead><tr><th>المنتج</th><th>الكمية</th><th>سعر الشراء</th><th>سعر البيع</th><th>قيمة الشراء</th><th>قيمة البيع</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:20px">لا توجد منتجات</td></tr>'}</tbody>
      <tfoot><tr><td colspan="4">الإجمالي</td><td>${fmtIQD(totalBuy)}</td><td>${fmtIQD(totalSell)}</td></tr>
      <tr><td colspan="5">الربح المتوقع</td><td>${fmtIQD(totalSell - totalBuy)}</td></tr></tfoot>
    </table>`;
  openPrint("تقرير المخزن", body);
}

export function printCustomerStatement(
  customer: Customer,
  sales: Sale[],
  payments: Payment[],
) {
  const fmtDate = (t: number) => new Date(t).toLocaleString("ar-IQ");
  const totalQty = sales.reduce((s, x) => s + x.quantity, 0);
  const totalSales = sales.reduce((s, x) => s + x.total, 0);
  const totalCash = sales
    .filter((x) => x.paymentType === "cash")
    .reduce((s, x) => s + x.total, 0);
  const totalDebtSales = sales
    .filter((x) => x.paymentType === "debt")
    .reduce((s, x) => s + x.total, 0);
  const totalPaid = payments.reduce((s, x) => s + x.amount, 0);
  const remaining = Math.max(0, Math.round(customer.totalDebt || 0));

  const salesRows = sales
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(
      (s, i) => `<tr>
        <td>${i + 1}</td>
        <td>${fmtDate(s.createdAt)}</td>
        <td>${s.productName}</td>
        <td>${s.quantity}</td>
        <td>${fmtIQD(s.unitPrice)}</td>
        <td>${fmtIQD(s.total)}</td>
        <td><span class="badge ${s.paymentType === "cash" ? "cash" : "debt"}">${s.paymentType === "cash" ? "نقد" : "أجل"}</span></td>
      </tr>`,
    )
    .join("");

  const payRows = payments
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(
      (p, i) => `<tr>
        <td>${i + 1}</td>
        <td>${fmtDate(p.createdAt)}</td>
        <td>${fmtIQD(p.amount)}</td>
      </tr>`,
    )
    .join("");

  const body = `${header("كشف حساب زبون")}
    <div class="info">
      <div><b>اسم الزبون:</b> ${customer.name}</div>
      <div><b>رقم الهاتف:</b> ${customer.phone}</div>
      <div><b>عدد الفواتير:</b> ${sales.length}</div>
      <div><b>إجمالي القطع المباعة:</b> ${totalQty}</div>
    </div>

    <h2 style="margin-top:22px">المشتريات</h2>
    <table>
      <thead><tr><th>#</th><th>التاريخ</th><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th><th>الدفع</th></tr></thead>
      <tbody>${salesRows || '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:20px">لا توجد مشتريات</td></tr>'}</tbody>
      <tfoot><tr><td colspan="3">الإجماليات</td><td>${totalQty}</td><td></td><td>${fmtIQD(totalSales)}</td><td></td></tr></tfoot>
    </table>

    <h2 style="margin-top:22px">التسديدات</h2>
    <table>
      <thead><tr><th>#</th><th>التاريخ</th><th>المبلغ المسدد</th></tr></thead>
      <tbody>${payRows || '<tr><td colspan="3" style="text-align:center;color:#64748b;padding:20px">لا توجد تسديدات</td></tr>'}</tbody>
      <tfoot><tr><td colspan="2">إجمالي التسديدات</td><td>${fmtIQD(totalPaid)}</td></tr></tfoot>
    </table>

    <div class="info" style="margin-top:18px">
      <div><b>إجمالي المبيعات:</b> ${fmtIQD(totalSales)}</div>
      <div><b>المدفوع نقداً:</b> ${fmtIQD(totalCash)}</div>
      <div><b>المباع بالأجل:</b> ${fmtIQD(totalDebtSales)}</div>
      <div><b>إجمالي التسديدات:</b> ${fmtIQD(totalPaid)}</div>
    </div>
    <div class="total"><span>الدين المتبقي</span><span>${fmtIQD(remaining)}</span></div>`;
  openPrint("كشف حساب", body);
}