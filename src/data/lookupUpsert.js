import { db } from "../lib/db";

/**
 * Find by (owner_id + name), otherwise insert and return id.
 * Works for tables that have unique(owner_id, name).
 */
export async function getOrCreateByName({ table, ownerId, name }) {
  const clean = (name || "").trim();
  if (!clean || !ownerId || !table) return null;

  const found = await db((s) =>
    s.from(table).select("id").eq("owner_id", ownerId).eq("name", clean).maybeSingle()
  );

  if (found?.error) throw found.error;
  if (found?.data?.id) return found.data.id;

  const inserted = await db((s) =>
    s.from(table).insert({ owner_id: ownerId, name: clean }).select("id").single()
  );

  if (inserted?.error) throw inserted.error;
  return inserted?.data?.id || null;
}

/**
 * Inventory subcategories are unique(owner_id, category_id, name)
 */
export async function getOrCreateSubcategory({ ownerId, categoryId, name }) {
  const clean = (name || "").trim();
  if (!clean || !ownerId || !categoryId) return null;

  const found = await db((s) =>
    s
      .from("inventory_subcategories")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("category_id", categoryId)
      .eq("name", clean)
      .maybeSingle()
  );

  if (found?.error) throw found.error;
  if (found?.data?.id) return found.data.id;

  const inserted = await db((s) =>
    s
      .from("inventory_subcategories")
      .insert({
        owner_id: ownerId,
        category_id: categoryId,
        name: clean,
      })
      .select("id")
      .single()
  );

  if (inserted?.error) throw inserted.error;
  return inserted?.data?.id || null;
}

/**
 * Compatibility no-ops for removed legacy concepts.
 * These stay here temporarily so older imports/pages don't explode
 * while you finish the refactor.
 */
export async function getOrCreateDeviceModel() {
  return null;
}

export async function getOrCreateVariant() {
  return null;
}
