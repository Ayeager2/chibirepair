import { db } from "../lib/db";

export async function listInventory() {
  const { data } = await db((s) =>
    s.from("inventory_view").select("*").order("created_at", { ascending: false })
  );

  return data || [];
}

export async function getInventoryItem(id) {
  if (!id) {
    throw new Error("Inventory item id is required.");
  }

  const { data } = await db((s) => s.from("inventory_items").select("*").eq("id", id).single());

  return data;
}

export async function createInventoryItem(payload) {
  const insert = buildInventoryPayload(payload, true);

  await db((s) => s.from("inventory_items").insert(insert));
}

export async function updateInventoryItem(id, payload) {
  if (!id) {
    throw new Error("Inventory item id is required.");
  }

  const update = buildInventoryPayload(payload, false);

  await db((s) => s.from("inventory_items").update(update).eq("id", id));
}

export async function deleteInventoryItem(id) {
  if (!id) {
    throw new Error("Inventory item id is required.");
  }

  await db((s) => s.from("inventory_items").delete().eq("id", id));
}

function buildInventoryPayload(payload, includeOwnerId = false) {
  const description = (payload.description || "").trim();
  const sku = payload.sku?.trim() || null;
  const deviceLabel = payload.device_label?.trim?.() || payload.deviceLabel?.trim?.() || null;
  const notes = payload.notes?.trim?.() || null;

  const itemType = payload.item_type || payload.itemType || "part";

  const validItemTypes = [
    "donor_device",
    "part",
    "finished_product",
    "supply",
    "tool",
    "accessory",
  ];

  if (!validItemTypes.includes(itemType)) {
    throw new Error("Item type is invalid.");
  }

  if (!description) {
    throw new Error("Description is required.");
  }

  const unitCost =
    payload.unit_cost === "" || payload.unit_cost == null
      ? payload.unitCost === "" || payload.unitCost == null
        ? 0
        : Number(payload.unitCost)
      : Number(payload.unit_cost);

  if (Number.isNaN(unitCost) || unitCost < 0) {
    throw new Error("Cost must be a valid number ≥ 0.");
  }

  const quantityRaw =
    payload.quantity === "" || payload.quantity == null ? payload.qty : payload.quantity;

  const quantity = quantityRaw === "" || quantityRaw == null ? 0 : parseInt(quantityRaw, 10);

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Quantity must be a whole number ≥ 0.");
  }

  const qtyOnHandRaw =
    payload.qty_on_hand === "" || payload.qty_on_hand == null ? quantity : payload.qty_on_hand;

  const qtyOnHand = qtyOnHandRaw === "" || qtyOnHandRaw == null ? 0 : parseInt(qtyOnHandRaw, 10);

  if (!Number.isInteger(qtyOnHand) || qtyOnHand < 0) {
    throw new Error("Qty on hand must be a whole number ≥ 0.");
  }

  const isForSale =
    payload.is_for_sale === true ||
    payload.is_for_sale === "true" ||
    payload.is_for_sale === 1 ||
    payload.isForSale === true ||
    payload.isForSale === "true" ||
    payload.isForSale === 1;

  let askingPrice = null;

  const askingPriceRaw =
    payload.asking_price === "" || payload.asking_price == null
      ? payload.askingPrice
      : payload.asking_price;

  if (isForSale) {
    askingPrice = askingPriceRaw === "" || askingPriceRaw == null ? null : Number(askingPriceRaw);

    if (askingPrice == null || Number.isNaN(askingPrice) || askingPrice < 0) {
      throw new Error("Asking price must be a valid number ≥ 0 for sale items.");
    }
  } else if (askingPriceRaw !== "" && askingPriceRaw != null) {
    const parsed = Number(askingPriceRaw);
    if (Number.isNaN(parsed) || parsed < 0) {
      throw new Error("Asking price must be blank or a valid number ≥ 0.");
    }
    askingPrice = parsed;
  }

  const base = {
    item_type: itemType,
    description,
    sku,
    device_label: deviceLabel,
    unit_cost: unitCost,
    asking_price: askingPrice,
    is_for_sale: isForSale,
    quantity,
    qty_on_hand: qtyOnHand,
    category_id: payload.category_id || payload.categoryId || null,
    subcategory_id: payload.subcategory_id || payload.subcategoryId || null,
    condition_id: payload.condition_id || payload.conditionId || null,
    status_id: payload.status_id || payload.statusId || null,
    source_id: payload.source_id || payload.sourceId || null,
    notes,
  };

  if (includeOwnerId) {
    const ownerId = payload.owner_id || payload.ownerId;
    if (!ownerId) {
      throw new Error("Owner id is required.");
    }
    base.owner_id = ownerId;
  }

  return base;
}

function applyInventorySearch(query, search) {
  const trimmed = (search || "").trim();

  if (!trimmed) return query;

  return query.or(
    [
      `description.ilike.%${trimmed}%`,
      `sku.ilike.%${trimmed}%`,
      `device_label.ilike.%${trimmed}%`,
      `notes.ilike.%${trimmed}%`,
    ].join(",")
  );
}

export async function searchInventoryForSale({
  ownerId,
  search = "",
  limit = 20,
  itemTypes = ["finished_product", "accessory", "part"],
} = {}) {
  if (!ownerId) {
    throw new Error("searchInventoryForSale: ownerId is required");
  }

  const { data } = await db((s) => {
    let query = s
      .from("inventory_items")
      .select(
        `
        id,
        item_type,
        description,
        sku,
        device_label,
        asking_price,
        qty_on_hand,
        is_for_sale
      `
      )
      .eq("owner_id", ownerId)
      .eq("is_for_sale", true)
      .gt("qty_on_hand", 0)
      .order("description", { ascending: true })
      .limit(limit);

    if (Array.isArray(itemTypes) && itemTypes.length > 0) {
      query = query.in("item_type", itemTypes);
    }

    query = applyInventorySearch(query, search);

    return query;
  });

  return data || [];
}
