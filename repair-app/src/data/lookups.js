import { db } from "../lib/db";

// Each function returns rows like: { id, name, ... }

export async function listCategories() {
  const { data } = await db((s) =>
    s.from("product_categories").select("id,name").order("name")
  );
  return data || [];
}

export async function listSubcategories(categoryId) {
  let q = db((s) => {
    let query = s.from("product_subcategories").select("id,name,category_id").order("name");
    if (categoryId) query = query.eq("category_id", categoryId);
    return query;
  });

  const { data } = await q;
  return data || [];
}

export async function listDeviceModels({ categoryId = null, subcategoryId = null } = {}) {
  const { data } = await db((s) => {
    let query = s.from("device_models").select("id,name,category_id,subcategory_id").order("name");
    if (categoryId) query = query.eq("category_id", categoryId);
    if (subcategoryId) query = query.eq("subcategory_id", subcategoryId);
    return query;
  });
  return data || [];
}

export async function listConditions() {
  const { data } = await db((s) =>
    s.from("product_conditions").select("id,name").order("name")
  );
  return data || [];
}

export async function listStatuses() {
  const { data } = await db((s) =>
    s.from("product_statuses").select("id,name").order("name")
  );
  return data || [];
}

export async function listSources() {
  const { data } = await db((s) =>
    s.from("sources").select("id,name").order("name")
  );
  return data || [];
}

export async function listVariants(deviceModelId) {
  const { data } = await db((s) => {
    let q = s.from("device_model_variants").select("id,name,device_model_id").order("name");
    if (deviceModelId) q = q.eq("device_model_id", deviceModelId);
    else q = q.eq("device_model_id", "__none__"); // return empty list when no model selected
    return q;
  });

  return data || [];
}