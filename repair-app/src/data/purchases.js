import { db } from "../lib/db";

export async function listPurchaseProducts() {
  const { data, error } = await db((s) =>
    s
      .from("inventory_view")
      .select("id, description, device_label, sku, qty_on_hand, cost, price")
      .order("created_at", { ascending: false }),
  );

  if (error) throw error;
  return data || [];
}

export async function createPurchaseWithItems(ownerId, payload) {
  const purchaseDate =
    payload.purchase_date || new Date().toISOString().slice(0, 10);
  const sellerName = (payload.seller_name || "").trim() || null;
  const notes = (payload.notes || "").trim() || null;
  const sourceId = payload.source_id || null;

  const cleanItems = (payload.items || [])
    .map((x) => ({
      product_id: x.product_id || null,
      quantity: parseInt(x.quantity, 10),
      unit_cost: Number(x.unit_cost),
    }))
    .filter(
      (x) =>
        x.product_id &&
        !Number.isNaN(x.quantity) &&
        x.quantity > 0 &&
        !Number.isNaN(x.unit_cost) &&
        x.unit_cost >= 0,
    );

  if (cleanItems.length === 0) {
    throw new Error("At least one valid purchase item is required.");
  }

  const totalCost = cleanItems.reduce(
    (sum, x) => sum + x.quantity * x.unit_cost,
    0,
  );

  const { data: purchase, error: purchaseError } = await db((s) =>
    s
      .from("purchases")
      .insert({
        owner_id: ownerId,
        purchase_date: purchaseDate,
        source_id: sourceId,
        seller_name: sellerName,
        total_cost: totalCost,
        notes,
      })
      .select("id")
      .single(),
  );

  if (purchaseError) throw purchaseError;

  const purchaseId = purchase.id;

  const purchaseItems = cleanItems.map((x) => ({
    owner_id: ownerId,
    purchase_id: purchaseId,
    product_id: x.product_id,
    quantity: x.quantity,
    unit_cost: x.unit_cost,
  }));

  const { error: itemsError } = await db((s) =>
    s.from("purchase_items").insert(purchaseItems),
  );

  if (itemsError) throw itemsError;

  // No React inventory math here anymore.
  // The SQL trigger updates products.qty_on_hand automatically.

  return purchaseId;
}

export async function listPurchases() {
  const { data, error } = await db((s) =>
    s
      .from("purchases")
      .select(
        `
        id,
        purchase_date,
        total_cost,
        seller_name,
        notes,
        created_at,
        source:sources(name)
      `,
      )
      .order("purchase_date", { ascending: false })
      .order("created_at", { ascending: false }),
  );

  if (error) throw error;
  return data || [];
}

export async function getPurchaseItems(purchaseId) {
  const { data, error } = await db((s) =>
    s
      .from("purchase_items")
      .select(
        `
        id,
        quantity,
        unit_cost,
        product_id,
        product:products(
          id,
          description,
          device_label,
          sku
        )
      `,
      )
      .eq("purchase_id", purchaseId)
      .order("created_at", { ascending: true }),
  );

  if (error) throw error;
  return data || [];
}
