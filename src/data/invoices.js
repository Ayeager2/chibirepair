import { db } from "../lib/db";

export function emptyInvoiceItem() {
  return {
    inventory_item_id: "",
    build_id: "",
    description: "",
    quantity: "1",
    unit_price: "0",
    line_type: "item",
    is_taxable: true,
  };
}

export async function createInvoiceWithItems({ ownerId, invoice, items }) {
  if (!ownerId) {
    throw new Error("createInvoiceWithItems: ownerId is required");
  }

  const cleanedItems = (items || [])
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);

      return {
        owner_id: ownerId,
        inventory_item_id: item.inventory_item_id || null,
        build_id: item.build_id || null,
        description: (item.description || "").trim() || null,
        quantity,
        unit_price: unitPrice,
        line_type: item.line_type || "item",
        is_taxable: item.is_taxable !== false,
      };
    })
    .filter((item) => item.description && item.quantity > 0);

  if (!invoice?.customer_id) {
    throw new Error("Customer is required.");
  }

  if (cleanedItems.length === 0) {
    throw new Error("At least one invoice item is required.");
  }

  const subtotal = cleanedItems.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );

  const tax = Number(invoice.tax || 0);
  const discount = Number(invoice.discount || 0);
  const total = Math.max(0, subtotal + tax - discount);

  const { data: invoiceRow, error: invoiceError } = await db((s) =>
    s
      .from("invoices")
      .insert([
        {
          owner_id: ownerId,
          customer_id: invoice.customer_id,
          build_id: invoice.build_id || null,
          invoice_date: invoice.invoice_date,
          subtotal,
          tax,
          discount,
          total,
          payment_status: invoice.payment_status || "unpaid",
          notes: (invoice.notes || "").trim() || null,
        },
      ])
      .select()
      .single()
  );

  if (invoiceError) throw invoiceError;

  const invoiceItemsPayload = cleanedItems.map((item) => ({
    owner_id: ownerId,
    invoice_id: invoiceRow.id,
    inventory_item_id: item.inventory_item_id,
    build_id: item.build_id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_type: item.line_type,
    is_taxable: item.is_taxable,
  }));

  const { error: itemsError } = await db((s) =>
    s.from("invoice_items").insert(invoiceItemsPayload)
  );

  if (itemsError) throw itemsError;

  return invoiceRow;
}

export async function listInvoices(ownerId) {
  if (!ownerId) {
    throw new Error("listInvoices: ownerId is required");
  }

  const { data, error } = await db((s) =>
    s
      .from("invoices")
      .select(
        `
        id,
        owner_id,
        invoice_number,
        invoice_date,
        subtotal,
        tax,
        discount,
        total,
        payment_status,
        notes,
        created_at,
        build_id,
        customer:customers (
          id,
          name,
          phone,
          email
        ),
        payments (
          id,
          amount,
          payment_method,
          payment_date
        )
      `
      )
      .eq("owner_id", ownerId)
      .order("invoice_date", { ascending: false })
      .order("created_at", { ascending: false })
  );

  if (error) throw error;

  return (data || []).map((row) => {
    const payments = row.payments || [];
    const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const balanceDue = Number(row.total || 0) - paidAmount;

    return {
      ...row,
      paid_amount: paidAmount,
      balance_due: balanceDue,
    };
  });
}

export async function getInvoiceItems(invoiceId, ownerId) {
  if (!invoiceId) {
    throw new Error("getInvoiceItems: invoiceId is required");
  }

  if (!ownerId) {
    throw new Error("getInvoiceItems: ownerId is required");
  }

  const { data, error } = await db((s) =>
    s
      .from("invoice_items")
      .select(
        `
        id,
        invoice_id,
        inventory_item_id,
        build_id,
        description,
        quantity,
        unit_price,
        line_total,
        line_type,
        is_taxable,
        created_at,
        inventory_item:inventory_items (
          id,
          item_type,
          description,
          sku,
          device_label
        )
      `
      )
      .eq("invoice_id", invoiceId)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true })
  );

  if (error) throw error;
  return data || [];
}

export async function getInvoicePayments(invoiceId, ownerId) {
  if (!invoiceId) {
    throw new Error("getInvoicePayments: invoiceId is required");
  }

  if (!ownerId) {
    throw new Error("getInvoicePayments: ownerId is required");
  }

  const { data, error } = await db((s) =>
    s
      .from("payments")
      .select(
        `
        id,
        invoice_id,
        amount,
        payment_method,
        payment_date,
        notes
      `
      )
      .eq("invoice_id", invoiceId)
      .eq("owner_id", ownerId)
      .order("payment_date", { ascending: false })
  );

  if (error) throw error;
  return data || [];
}

export async function addPaymentToInvoice({
  ownerId,
  invoiceId,
  amount,
  paymentMethod = "",
  paymentDate,
  notes = "",
} = {}) {
  if (!ownerId) {
    throw new Error("addPaymentToInvoice: ownerId is required");
  }

  if (!invoiceId) {
    throw new Error("addPaymentToInvoice: invoiceId is required");
  }

  const amountNum = Number(amount || 0);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    throw new Error("Payment amount must be greater than 0.");
  }

  const { data: invoiceRow, error: invoiceError } = await db((s) =>
    s
      .from("invoices")
      .select(
        `
        id,
        owner_id,
        total,
        payment_status
      `
      )
      .eq("id", invoiceId)
      .eq("owner_id", ownerId)
      .single()
  );

  if (invoiceError) throw invoiceError;

  const { data: existingPayments, error: paymentsError } = await db((s) =>
    s
      .from("payments")
      .select(
        `
        id,
        amount
      `
      )
      .eq("invoice_id", invoiceId)
      .eq("owner_id", ownerId)
  );

  if (paymentsError) throw paymentsError;

  const currentPaid = (existingPayments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const newPaid = currentPaid + amountNum;
  const total = Number(invoiceRow.total || 0);
  const epsilon = 0.00001;

  if (newPaid - total > epsilon) {
    throw new Error("Payment exceeds remaining invoice balance.");
  }

  let nextStatus = "unpaid";
  if (newPaid <= 0) {
    nextStatus = "unpaid";
  } else if (newPaid < total) {
    nextStatus = "partial";
  } else {
    nextStatus = "paid";
  }

  const { data: paymentRow, error: insertPaymentError } = await db((s) =>
    s
      .from("payments")
      .insert([
        {
          owner_id: ownerId,
          invoice_id: invoiceId,
          amount: amountNum,
          payment_method: paymentMethod || null,
          payment_date: paymentDate || new Date().toISOString(),
          notes: (notes || "").trim() || null,
        },
      ])
      .select()
      .single()
  );

  if (insertPaymentError) throw insertPaymentError;

  const { error: updateInvoiceError } = await db((s) =>
    s
      .from("invoices")
      .update({
        payment_status: nextStatus,
      })
      .eq("id", invoiceId)
      .eq("owner_id", ownerId)
  );

  if (updateInvoiceError) throw updateInvoiceError;

  return {
    payment: paymentRow,
    paid_amount: newPaid,
    balance_due: total - newPaid,
    payment_status: nextStatus,
  };
}
