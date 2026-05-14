import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product, Sale, Customer, Payment } from "./types";

function useCol<T>(name: string, orderField?: string): T[] {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const q = orderField
      ? query(collection(db, name), orderBy(orderField, "desc"))
      : query(collection(db, name));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as T));
    });
    return () => unsub();
  }, [name, orderField]);
  return items;
}

export function useProducts() {
  const products = useCol<Product>("products");
  return { products: [...products].sort((a, b) => a.name.localeCompare(b.name, "ar")) };
}

export function useCustomers() {
  const customers = useCol<Customer>("customers", "createdAt");
  return { customers };
}

export function useSales() {
  return useCol<Sale>("sales", "createdAt");
}

export function usePayments() {
  return useCol<Payment>("payments", "createdAt");
}

export async function addProduct(p: Omit<Product, "id">) {
  await addDoc(collection(db, "products"), p);
}

export async function updateProduct(id: string, p: Partial<Omit<Product, "id">>) {
  await updateDoc(doc(db, "products", id), p);
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(db, "products", id));
}

export async function deleteCustomer(id: string) {
  await deleteDoc(doc(db, "customers", id));
}

/** Create a sale — decreases inventory atomically and updates/creates customer.
 * Returns sale data for printing. */
export async function createSale(input: {
  customerName: string;
  phone: string;
  productId: string;
  quantity: number;
  paymentType: "cash" | "debt";
}) {
  const productRef = doc(db, "products", input.productId);
  const salesCol = collection(db, "sales");
  const customersCol = collection(db, "customers");

  const result = await runTransaction(db, async (tx) => {
    const productSnap = await tx.get(productRef);
    if (!productSnap.exists()) throw new Error("المنتج غير موجود");
    const product = productSnap.data() as Omit<Product, "id">;
    if (product.quantity < input.quantity) {
      throw new Error("الكمية المطلوبة غير متوفرة في المخزن");
    }
    const total = Math.round(product.salePrice * input.quantity);

    // upsert customer by phone (read outside tx writes; acceptable for single-cashier use)
    let customerId: string | null = null;
    const customersSnapAll = await getDocs(
      query(customersCol, where("phone", "==", input.phone)),
    );
    if (!customersSnapAll.empty) {
      const c = customersSnapAll.docs[0];
      customerId = c.id;
      const data = c.data() as Customer;
      tx.update(doc(db, "customers", c.id), {
        name: input.customerName,
        totalDebt:
          Math.round(data.totalDebt || 0) +
          (input.paymentType === "debt" ? total : 0),
      });
    } else {
      const newRef = doc(customersCol);
      customerId = newRef.id;
      tx.set(newRef, {
        name: input.customerName,
        phone: input.phone,
        totalDebt: input.paymentType === "debt" ? total : 0,
        totalPaid: 0,
        createdAt: Date.now(),
      } satisfies Omit<Customer, "id">);
    }

    tx.update(productRef, { quantity: product.quantity - input.quantity });

    const saleRef = doc(salesCol);
    const sale: Omit<Sale, "id"> = {
      customerName: input.customerName,
      phone: input.phone,
      productId: input.productId,
      productName: product.name,
      unitPrice: Math.round(product.salePrice),
      quantity: input.quantity,
      total,
      paymentType: input.paymentType,
      createdAt: Date.now(),
    };
    tx.set(saleRef, sale);

    return { id: saleRef.id, ...sale, customerId };
  });

  return result;
}

/** Pay debt — does NOT touch inventory. Reduces customer.totalDebt. */
export async function payDebt(customerId: string, amount: number) {
  const amt = Math.max(0, Math.round(amount));
  if (amt === 0) return;
  const ref = doc(db, "customers", customerId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("الزبون غير موجود");
    const c = snap.data() as Customer;
    const newDebt = Math.max(0, Math.round((c.totalDebt || 0) - amt));
    const paid = Math.round((c.totalPaid || 0) + amt);
    tx.update(ref, { totalDebt: newDebt, totalPaid: paid });
    const payRef = doc(collection(db, "payments"));
    tx.set(payRef, {
      customerId,
      amount: amt,
      createdAt: Date.now(),
    } satisfies Omit<Payment, "id">);
  });
}
