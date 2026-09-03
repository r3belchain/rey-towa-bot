import { supabase } from "../../database/supabase.js";

/**
 * Mengambil data inventory milik seorang warga
 */
export async function getUserInventory(userId: string) {
  const { data, error } = await supabase
    .from("user_inventory")
    .select(
      `
      quantity,
      durability,
      master_items (
        id,
        name,
        category,
        description,
        is_tradeable
      )
    `,
    )
    .eq("discord_id", userId)
    .order("id", { ascending: false });

  return { data, error };
}

/**
 * Mengambil informasi satu item spesifik dari tas warga
 */
export async function getSpecificItem(userId: string, itemId: string) {
  const { data, error } = await supabase
    .from("user_inventory")
    .select(
      `
      quantity,
      durability,
      master_items (
        id,
        name,
        category,
        description,
        is_tradeable
      )
    `,
    )
    .eq("discord_id", userId)
    .eq("item_id", itemId)
    .maybeSingle();

  return { data, error };
}

/**
 * Mengeksekusi transfer item antar warga via Supabase RPC
 */
export async function transferItem(
  senderId: string,
  receiverId: string,
  itemId: string,
  qty: number,
): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.rpc("transfer_item", {
    p_sender_id: senderId,
    p_receiver_id: receiverId,
    p_item_id: itemId.toLowerCase(),
    p_quantity: qty,
  });

  if (error) {
    console.error("❌ RPC Error [transferItem]:", error.message);
    return {
      success: false,
      message: "Terjadi kesalahan sistem database (RPC Error).",
    };
  }

  // Type assertion untuk response dari RPC
  return data as { success: boolean; message: string };
}

