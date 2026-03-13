import { db } from "../lib/db";

/**
 * Find by (owner_id + name), otherwise insert and return id.
 * Works for tables that have unique(owner_id, name).
 */
export async function getOrCreateByName({ table, ownerId, name }) {
  const clean = (name || "").trim();
  if (!clean) return null;

  // Try find first
  const found = await db((s) =>
    s
      .from(table)
      .select("id")
      .eq("owner_id", ownerId)
      .eq("name", clean)
      .maybeSingle()
  );

  if (found.data?.id) return found.data.id;

  // Insert
  const inserted = await db((s) =>
    s
      .from(table)
      .insert({ owner_id: ownerId, name: clean })
      .select("id")
      .single()
  );

  return inserted.data.id;
}

/**
 * Subcategories are unique(owner_id, category_id, name)
 */
export async function getOrCreateSubcategory({ ownerId, categoryId, name }) {
  const clean = (name || "").trim();
  if (!clean || !categoryId) return null;

  const found = await db((s) =>
    s
      .from("product_subcategories")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("category_id", categoryId)
      .eq("name", clean)
      .maybeSingle()
  );

  if (found.data?.id) return found.data.id;

  const inserted = await db((s) =>
    s
      .from("product_subcategories")
      .insert({ owner_id: ownerId, category_id: categoryId, name: clean })
      .select("id")
      .single()
  );

  return inserted.data.id;
}

/**
 * Device models are tied to category + (optional) subcategory
 * Unique enforced by partial unique indexes in SQL.
 */
export async function getOrCreateDeviceModel({
  ownerId,
  categoryId,
  subcategoryId = null,
  name,
}) {
  const clean = (name || "").trim();
  if (!clean || !ownerId || !categoryId) return null;

  // Find existing
  const found = await db((s) => {
    let q = s
      .from("device_models")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("category_id", categoryId)
      .eq("name", clean);

    if (subcategoryId) q = q.eq("subcategory_id", subcategoryId);
    else q = q.is("subcategory_id", null);

    return q.maybeSingle();
  });

  if (found.data?.id) return found.data.id;

  // Insert new
  const inserted = await db((s) =>
    s
      .from("device_models")
      .insert({
        owner_id: ownerId,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        name: clean,
      })
      .select("id")
      .single()
  );

  return inserted.data.id;
}

export async function getOrCreateVariant({ ownerId, deviceModelId, name }) {
  const clean = (name || "").trim();
  if (!clean || !ownerId || !deviceModelId) return null;

  const found = await db((s) =>
    s
      .from("device_model_variants")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("device_model_id", deviceModelId)
      .eq("name", clean)
      .maybeSingle()
  );

  if (found.data?.id) return found.data.id;

  const inserted = await db((s) =>
    s
      .from("device_model_variants")
      .insert({
        owner_id: ownerId,
        device_model_id: deviceModelId,
        name: clean,
      })
      .select("id")
      .single()
  );

  return inserted.data.id;
}
