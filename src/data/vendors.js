import { db } from "../lib/db";

export async function listVendors() {
  const { data } = await db((s) =>
    s.from("vendors").select("*").order("created_at", { ascending: false })
  );

  return data || [];
}

export async function createVendor(ownerId, payload) {
  const insert = buildVendorPayload(payload, ownerId);

  if (!insert.name) {
    throw new Error("Vendor name is required.");
  }

  await db((s) => s.from("vendors").insert(insert));
}

export async function updateVendor(id, payload) {
  if (!id) {
    throw new Error("Vendor id is required.");
  }

  const update = buildVendorPayload(payload);

  if (!update.name) {
    throw new Error("Vendor name is required.");
  }

  await db((s) => s.from("vendors").update(update).eq("id", id));
}

export async function deleteVendor(id) {
  if (!id) {
    throw new Error("Vendor id is required.");
  }

  await db((s) => s.from("vendors").delete().eq("id", id));
}

function buildVendorPayload(payload, ownerId = null) {
  const base = {
    name: (payload.name || "").trim(),
    phone: (payload.phone || "").trim() || null,
    email: (payload.email || "").trim() || null,
    website: (payload.website || "").trim() || null,
    notes: (payload.notes || "").trim() || null,
  };

  if (ownerId) {
    base.owner_id = ownerId;
  }

  return base;
}
