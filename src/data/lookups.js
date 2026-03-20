import { db } from "../lib/db";

// Compatibility-friendly lookup layer for the new inventory schema

export async function listCategories() {
  const { data, error } = await db((s) =>
    s.from("inventory_categories").select("id,name").order("name")
  );

  if (error) throw error;
  return data || [];
}

export async function listSubcategories(categoryId) {
  const { data, error } = await db((s) => {
    let query = s.from("inventory_subcategories").select("id,name,category_id").order("name");

    if (categoryId) query = query.eq("category_id", categoryId);

    return query;
  });

  if (error) throw error;
  return data || [];
}

export async function listConditions() {
  const { data, error } = await db((s) =>
    s.from("item_conditions").select("id,name").order("name")
  );

  if (error) throw error;
  return data || [];
}

export async function listStatuses() {
  const { data, error } = await db((s) => s.from("item_statuses").select("id,name").order("name"));

  if (error) throw error;
  return data || [];
}

export async function listSources() {
  const { data, error } = await db((s) => s.from("sources").select("id,name").order("name"));

  if (error) throw error;
  return data || [];
}

export async function listVendors() {
  const { data, error } = await db((s) => s.from("vendors").select("id,name").order("name"));

  if (error) throw error;
  return data || [];
}

export async function listRepairStatuses() {
  const { data, error } = await db((s) =>
    s.from("repair_statuses").select("id,name").order("name")
  );

  if (error) throw error;
  return data || [];
}

// Legacy compatibility exports so older screens do not crash.
// These tables no longer exist in the new schema.

export async function listDeviceModels() {
  return [];
}

export async function listVariants() {
  return [];
}
