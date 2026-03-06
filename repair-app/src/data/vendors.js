import { db } from "../lib/db";

export async function listVendors() {
  const { data, error } = await db((s) =>
    s.from("vendors").select("*").order("created_at", { ascending: false }),
  );
  if (error) throw error;
  return data || [];
}

export async function createVendor(ownerId, payload) {
  const insert = {
    owner_id: ownerId,
    name: (payload.name || "").trim(),
    phone: (payload.phone || "").trim() || null,
    email: (payload.email || "").trim() || null,
    notes: (payload.notes || "").trim() || null,
  };

  if (!insert.name) throw new Error("Vendor name is required.");

  const { error } = await db((s) => s.from("vendors").insert(insert));
  if (error) throw error;
}

export async function updateVendor(id, payload) {
  const update = {
    name: (payload.name || "").trim(),
    phone: (payload.phone || "").trim() || null,
    email: (payload.email || "").trim() || null,
    notes: (payload.notes || "").trim() || null,
  };

  if (!update.name) throw new Error("Vendor name is required.");

  const { error } = await db((s) =>
    s.from("vendors").update(update).eq("id", id),
  );
  if (error) throw error;
}

export async function deleteVendor(id) {
  const { error } = await db((s) => s.from("vendors").delete().eq("id", id));
  if (error) throw error;
}
