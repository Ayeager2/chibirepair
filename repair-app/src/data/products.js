import { db } from "../lib/db";

export async function listProducts() {
  const { data, error } = await db((s) =>
    s
      .from("inventory_view")
      .select("*")
      .order("created_at", { ascending: false }),
  );

  if (error) throw error;

  return data || [];
}

export async function createProduct(userId, payload) {
  const insert = {
    owner_id: userId,
    description: (payload.description || "").trim(),
    sku: payload.sku?.trim() || null,
    cost: Number(payload.cost || 0),
    price: Number(payload.price || 0),
    qty_on_hand: parseInt(payload.qty_on_hand || "0", 10),

    category_id: payload.category_id || null,
    subcategory_id: payload.subcategory_id || null,
    device_model_id: payload.device_model_id || null,
    variant_id: payload.variant_id || null,
    condition_id: payload.condition_id || null,
    status_id: payload.status_id || null,
    source_id: payload.source_id || null,
  };

  if (!insert.description) throw new Error("Description is required.");

  const { error } = await db((s) => s.from("products").insert(insert));
  if (error) throw error;
}

export async function deleteProduct(id) {
  const { error } = await db((s) => s.from("products").delete().eq("id", id));
  if (error) throw error;
}
function applyProductSearch(query, search) {
  const trimmed = (search || "").trim();

  if (!trimmed) return query;

  return query.or(
    [
      `description.ilike.%${trimmed}%`,
      `sku.ilike.%${trimmed}%`,
      `device_label.ilike.%${trimmed}%`,
    ].join(","),
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
      `,
      )
      .eq("owner_id", ownerId)
      .order("description", { ascending: true })
      .limit(limit);

    query = applyProductSearch(query, search);

    return query;
  });

  return data || [];
}
