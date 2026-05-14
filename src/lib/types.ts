export type Product = {
  id: string;
  name: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
};

export type Sale = {
  id: string;
  customerName: string;
  phone: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
  paymentType: "cash" | "debt";
  createdAt: number;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  totalDebt: number;
  totalPaid: number;
  createdAt: number;
};

export type Payment = {
  id: string;
  customerId: string;
  amount: number;
  createdAt: number;
};

export const fmtIQD = (n: number) =>
  `${Math.round(n).toLocaleString("en-US")} د.ع`;