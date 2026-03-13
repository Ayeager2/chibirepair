import { db } from "../lib/db";

export async function listProducts() {
  const { data } = await db((s) =>
    s
      .from("inventory_view")
      .select("*")
      .order("created_at", { ascending: false })
  );

  return data || [];
}

export async function createProduct(userId, payload) {
  const insert = buildProductPayload(payload, userId);

  if (!insert.description) {
    throw new Error("Description is required.");
  }

  await db((s) => s.from("products").insert(insert));
}

export async function updateProduct(id, payload) {
  if (!id) {
    throw new Error("Product id is required.");
  }

  const update = buildProductPayload(payload);

  if (!update.description) {
    throw new Error("Description is required.");
  }

  await db((s) => s.from("products").update(update).eq("id", id));
}

export async function deleteProduct(id) {
  await db((s) => s.from("products").delete().eq("id", id));
}

function buildProductPayload(payload, userId = null) {
  const description = (payload.description || "").trim();
  const sku = payload.sku?.trim() || null;

  const cost =
    payload.cost === "" || payload.cost == null ? 0 : Number(payload.cost);

  const qtyOnHand =
    payload.qty_on_hand === "" || payload.qty_on_hand == null
      ? 0
      : parseInt(payload.qty_on_hand, 10);

  const isForSale =
    payload.is_for_sale === true ||
    payload.is_for_sale === "true" ||
    payload.is_for_sale === 1;

  let price = null;

  if (isForSale) {
    price =
      payload.price === "" || payload.price == null ? 0 : Number(payload.price);
  }

  if (!description) {
    throw new Error("Description is required.");
  }

  if (Number.isNaN(cost) || cost < 0) {
    throw new Error("Cost must be a valid number ≥ 0.");
  }

  if (!Number.isInteger(qtyOnHand) || qtyOnHand < 0) {
    throw new Error("Qty must be a whole number ≥ 0.");
  }

  if (isForSale && (price == null || Number.isNaN(price) || price < 0)) {
    throw new Error("Price must be a valid number ≥ 0 for sale items.");
  }

  const base = {
    description,
    sku,
    cost,
    price,
    is_for_sale: isForSale,
    qty_on_hand: qtyOnHand,

    category_id: payload.category_id || null,
    subcategory_id: payload.subcategory_id || null,
    device_model_id: payload.device_model_id || null,
    variant_id: payload.variant_id || null,
    condition_id: payload.condition_id || null,
    status_id: payload.status_id || null,
    source_id: payload.source_id || null,
  };

  if (userId) {
    base.owner_id = userId;
  }

  return base;
}

function applyProductSearch(query, search) {
  const trimmed = (search || "").trim();

  if (!trimmed) return query;

  return query.or(
    [
      `description.ilike.%${trimmed}%`,
      `sku.ilike.%${trimmed}%`,
      `device_label.ilike.%${trimmed}%`,
    ].join(",")
  );
}

export async function searchProductsForInvoice({
  ownerId,
  search = "",
  limit = 20,
} = {}) {
  if (!ownerId) {
    throw new Error("searchProductsForInvoice: ownerId is required");
  }

  const { data } = await db((s) => {
    let query = s
      .from("products")
      .select(
        `
        id,
        description,
        sku,
        price,
        qty_on_hand,
        device_label
      `
      )
      .eq("owner_id", ownerId)
      .order("description", { ascending: true })
      .limit(limit);

    query = applyProductSearch(query, search);

    return query;
  });

  return data || [];
}
