import { db } from "../lib/db";

function applyCustomerSearch(query, search) {
  const trimmed = (search || "").trim();

  if (!trimmed) return query;

  return query.or(
    [
      `name.ilike.%${trimmed}%`,
      `phone.ilike.%${trimmed}%`,
      `email.ilike.%${trimmed}%`,
      `address_line1.ilike.%${trimmed}%`,
      `city.ilike.%${trimmed}%`,
      `state.ilike.%${trimmed}%`,
      `postal_code.ilike.%${trimmed}%`,
    ].join(","),
  );
}

export async function listCustomers({
  ownerId,
  search = "",
  activeOnly = false,
} = {}) {
  if (!ownerId) {
    throw new Error("listCustomers: ownerId is required");
  }

  const { data } = await db((s) => {
    let query = s
      .from("customers")
      .select(
        `
        id,
        owner_id,
        name,
        phone,
        email,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        notes,
        active,
        created_at
      `,
      )
      .eq("owner_id", ownerId)
      .order("name", { ascending: true });

    query = applyCustomerSearch(query, search);

    if (activeOnly) {
      query = query.eq("active", true);
    }

    return query;
  });

  return data || [];
}

export async function searchCustomersForSelect({
  ownerId,
  search = "",
  limit = 10,
  activeOnly = true,
} = {}) {
  if (!ownerId) {
    throw new Error("searchCustomersForSelect: ownerId is required");
  }

  const { data } = await db((s) => {
    let query = s
      .from("customers")
      .select(
        `
        id,
        name,
        phone,
        email,
        city,
        state,
        active
      `,
      )
      .eq("owner_id", ownerId)
      .order("name", { ascending: true })
      .limit(limit);

    if (activeOnly) {
      query = query.eq("active", true);
    }

    query = applyCustomerSearch(query, search);

    return query;
  });

  return data || [];
}

export async function getCustomerById(id, ownerId) {
  if (!id) {
    throw new Error("getCustomerById: id is required");
  }

  if (!ownerId) {
    throw new Error("getCustomerById: ownerId is required");
  }

  const { data } = await db((s) =>
    s
      .from("customers")
      .select(
        `
        id,
        owner_id,
        name,
        phone,
        email,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        notes,
        active,
        created_at
      `,
      )
      .eq("id", id)
      .eq("owner_id", ownerId)
      .single(),
  );

  return data;
}

export async function createCustomer(payload) {
  const { data } = await db((s) =>
    s.from("customers").insert([payload]).select().single(),
  );

  return data;
}

export async function updateCustomer(id, ownerId, payload) {
  if (!id) {
    throw new Error("updateCustomer: id is required");
  }

  if (!ownerId) {
    throw new Error("updateCustomer: ownerId is required");
  }

  const { data } = await db((s) =>
    s
      .from("customers")
      .update(payload)
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select()
      .single(),
  );

  return data;
}

export async function setCustomerActive(id, ownerId, active) {
  return updateCustomer(id, ownerId, { active });
}

export function emptyCustomer() {
  return {
    name: "",
    phone: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    notes: "",
    active: true,
  };
}

export function normalizeCustomerPayload(form, ownerId) {
  return {
    owner_id: ownerId,
    name: (form.name || "").trim(),
    phone: (form.phone || "").trim() || null,
    email: (form.email || "").trim() || null,
    address_line1: (form.address_line1 || "").trim() || null,
    address_line2: (form.address_line2 || "").trim() || null,
    city: (form.city || "").trim() || null,
    state: (form.state || "").trim() || null,
    postal_code: (form.postal_code || "").trim() || null,
    notes: (form.notes || "").trim() || null,
    active: !!form.active,
  };
}
