// src/services/economy/useItemService.ts
import { supabase } from "../../database/supabase.js";

export async function useItem(userId: string, itemId: string) {
  // Cek Ketersediaan 
  const { data: invItem } = await supabase
    .from("user_inventory")
    .select("quantity")
    .eq("discord_id", userId)
    .eq("item_id", itemId)
    .maybeSingle();

  if (!invItem || (invItem.quantity ?? 0) < 1) {
    return {
      success: false,
      message: "❌ Kamu tidak memiliki item ini di tasmu!",
    };
  }

  // Tarik Data User aat ini)
  const { data: user } = await supabase
    .from("users")
    .select("stamina, bensin, buff_rokok_charges, buff_kopi_expires")
    .eq("discord_id", userId)
    .maybeSingle();

  if (!user)
    return { success: false, message: "❌ Data user tidak ditemukan." };

  let updatePayload: any = {};
  let effectMessage = "";

  // Logika Efek Masing-Masing Item
  switch (itemId) {
    case "item_nasitelur":
      const currentStam = user.stamina ?? 0;
      if (currentStam >= 100)
        return {
          success: false,
          message: "⚡ Staminamu sudah penuh (100/100)!",
        };
      updatePayload.stamina = Math.min(100, currentStam + 50);
      effectMessage = `🍳 Memakan **Nasi Telur**. Stamina pulih +50! (${updatePayload.stamina}/100)`;
      break;

    case "item_bensin":
      const currentBensin = user.bensin ?? 0;
      if (currentBensin >= 100)
        return {
          success: false,
          message: "⛽ Tangki bensin motormu sudah penuh!",
        };
      updatePayload.bensin = Math.min(100, currentBensin + 50);
      effectMessage = `⛽ Mengisi **Pertalite**. Bensin bertambah +50%! (${updatePayload.bensin}%)`;
      break;

    case "item_rokok":
      updatePayload.buff_rokok_charges = (user.buff_rokok_charges ?? 0) + 1;
      effectMessage =
        "🚬 Menghisap **Rokok Sebat**. Cooldown /ngojek berikutnya didiskon 20%!";
      break;

    case "item_kopisusu":
  
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      updatePayload.buff_kopi_expires = expiresAt;
      effectMessage =
        "☕ Meminum **Kopi Susu Pangkalan**. Cooldown /ngojek didiskon 30% selama 30 menit ke depan!";
      break;

    default:
      return {
        success: false,
        message: "❌ Item ini belum bisa digunakan saat ini.",
      };
  }

  // Terapkan Efek ke Tabel Users
  const { error: userErr } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("discord_id", userId);
  if (userErr)
    return {
      success: false,
      message: "❌ Terjadi kesalahan saat mengaplikasikan efek.",
    };

  // Kurangi Item dari Inventory 
  const newQuantity = (invItem.quantity ?? 1) - 1;
  if (newQuantity <= 0) {
    await supabase
      .from("user_inventory")
      .delete()
      .eq("discord_id", userId)
      .eq("item_id", itemId);
  } else {
    await supabase
      .from("user_inventory")
      .update({ quantity: newQuantity })
      .eq("discord_id", userId)
      .eq("item_id", itemId);
  }

  return { success: true, message: effectMessage };
}
