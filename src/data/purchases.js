import { db } from "../lib/db";

export async function listPurchaseInventory() {
  const { data, error } = await db((s) =>
    s
      .from("inventory_view")
      .select("id, item_type, description, device_label, sku, qty_on_hand, unit_cost, asking_price")
      .order("created_at", { ascending: false })
  );

  if (error) throw error;
  return data || [];
}

export async function createPurchaseWithItems(ownerId, payload) {
  if (!ownerId) {
    throw new Error("Owner id is required.");
  }

  const purchaseDate = payload.purchase_date || new Date().toISOString().slice(0, 10);
  const sellerName = (payload.seller_name || "").trim() || null;
  const notes = (payload.notes || "").trim() || null;
  const sourceId = payload.source_id || null;
  const vendorId = payload.vendor_id || null;
  const shippingCost =
    payload.shipping_cost === "" || payload.shipping_cost == null
      ? 0
      : Number(payload.shipping_cost);
  const tax = payload.tax === "" || payload.tax == null ? 0 : Number(payload.tax);

  if (Number.isNaN(shippingCost) || shippingCost < 0) {
    throw new Error("Shipping cost must be a valid number ≥ 0.");
  }

  if (Number.isNaN(tax) || tax < 0) {
    throw new Error("Tax must be a valid number ≥ 0.");
  }

  const cleanItems = (payload.items || [])
    .map((x) => {
      const quantity = parseInt(x.quantity, 10);
      const unitCost = Number(x.unit_cost);
      const description = (x.description || "").trim();

      return {
        inventory_item_id: x.inventory_item_id || null,
        description,
        quantity,
        unit_cost: unitCost,
      };
    })
    .filter(
      (x) =>
        x.description &&
        !Number.isNaN(x.quantity) &&
        x.quantity > 0 &&
        !Number.isNaN(x.unit_cost) &&
        x.unit_cost >= 0
    );

  if (cleanItems.length === 0) {
    throw new Error("At least one valid purchase item is required.");
  }

  const subtotal = cleanItems.reduce((sum, x) => sum + x.quantity * x.unit_cost, 0);
  const totalCost = subtotal + shippingCost + tax;

  const { data: purchase, error: purchaseError } = await db((s) =>
    s
      .from("purchases")
      .insert({
        owner_id: ownerId,
        vendor_id: vendorId,
        source_id: sourceId,
        seller_name: sellerName,
        purchase_date: purchaseDate,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        tax: tax,
        total_cost: totalCost,
        notes,
      })
      .select("id")
      .single()
  );

  if (purchaseError) throw purchaseError;

  const purchaseId = purchase.id;

  const purchaseItems = cleanItems.map((x) => ({
    owner_id: ownerId,
    purchase_id: purchaseId,
    inventory_item_id: x.inventory_item_id,
    description: x.description,
    quantity: x.quantity,
    unit_cost: x.unit_cost,
    line_total: x.quantity * x.unit_cost,
  }));

  const { error: itemsError } = await db((s) => s.from("purchase_items").insert(purchaseItems));

  if (itemsError) throw itemsError;

  return purchaseId;
}

export async function listPurchases() {
  const { data, error } = await db((s) =>
    s
      .from("purchases")
      .select(
        `
        id,
        purchase_number,
        purchase_date,
        subtotal,
        shipping_cost,
        tax,
        total_cost,
        seller_name,
        notes,
        created_at,
        source:sources(name),
        vendor:vendors(name)
      `
      )
      .order("purchase_date", { ascending: false })
      .order("created_at", { ascending: false })
  );

  if (error) throw error;
  return data || [];
}

export async function getPurchaseItems(purchaseId) {
  if (!purchaseId) {
    throw new Error("Purchase id is required.");
  }

  const { data, error } = await db((s) =>
    s
      .from("purchase_items")
      .select(
        `
        id,
        quantity,
        unit_cost,
        line_total,
        description,
        inventory_item_id,
        inventory_item:inventory_items(
          id,
          item_type,
          description,
          device_label,
          sku
        )
      `
      )
      .eq("purchase_id", purchaseId)
      .order("created_at", { ascending: true })
  );

  if (error) throw error;
  return data || [];
}
