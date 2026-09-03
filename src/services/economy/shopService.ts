import { supabase } from "../../database/supabase.js";

/**
 * Mengambil daftar barang yang dijual di Shop (buy_price > 0)
 */
export async function getShopCatalog() {
  const { data, error } = await supabase
    .from("master_items")
    .select(
      "id, name, description, category, rarity, buy_price, max_stack, requirements",
    )
    .gt("buy_price", 0)
    .order("buy_price", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data shop:", error);
    return [];
  }
  return data;
}

/**
 * Logika Transaksi Pembelian Barang Berbasis JSONB Requirements
 */
export async function buyItem(
  userId: string,
  itemId: string,
  quantity: number = 1,
) {
  if (quantity < 1)
    return { success: false, message: "❌ Jumlah pembelian tidak valid!" };

  // 1. Tarik Data Barang
  const { data: item } = await supabase
    .from("master_items")
    .select("name, buy_price, max_stack, requirements")
    .eq("id", itemId)
    .maybeSingle();

  if (!item || !item.buy_price || item.buy_price <= 0) {
    return { success: false, message: "❌ Barang ini tidak tersedia di Shop." };
  }

  const totalCost = item.buy_price * quantity;

  // Tarik Data User
  const { data: user } = await supabase
    .from("users")
    .select(
      "t_coin, job, total_ojek_count, total_jukir_count, total_mancing_count",
    )
    .eq("discord_id", userId)
    .maybeSingle();

  if (!user)
    return { success: false, message: "❌ Data user tidak ditemukan." };
  if ((user.t_coin || 0) < totalCost) {
    return {
      success: false,
      message: `💸 **Uang Tidak Cukup!**\nTotal harga: **${totalCost.toLocaleString("id-ID")} TC**\nUangmu: **${(user.t_coin || 0).toLocaleString("id-ID")} TC**`,
    };
  }

  // UNIVERSAL HARD GATE (JSONB DRIVEN)

  if (item.requirements && typeof item.requirements === "object") {

    const reqs = item.requirements as Record<string, any>;

  
    if (reqs.req_job && user.job !== reqs.req_job) {
      return {
        success: false,
        message: `🔒 **Item Terkunci!**\nItem ini eksklusif hanya untuk profesi: **${reqs.req_job}**.`,
      };
    }

    // Validasi Total Ngojek
    if (
      reqs.req_ojek_count &&
      (user.total_ojek_count || 0) < reqs.req_ojek_count
    ) {
      return {
        success: false,
        message: `🔒 **Item Terkunci!**\nSyarat minimum: **${reqs.req_ojek_count}x Narik Ojek**.`,
      };
    }

    // Validasi Total Jukir
    if (
      reqs.req_jukir_count &&
      (user.total_jukir_count || 0) < reqs.req_jukir_count
    ) {
      return {
        success: false,
        message: `🔒 **Item Terkunci!**\nSyarat minimum: **${reqs.req_jukir_count}x Markir**.`,
      };
    }

    // Validasi Total Mancing
    if (
      reqs.req_mancing_count &&
      (user.total_mancing_count || 0) < reqs.req_mancing_count
    ) {
      return {
        success: false,
        message: `🔒 **Item Terkunci!**\nSyarat minimum: **${reqs.req_mancing_count}x Mancing**.`,
      };
    }
  }

  // Cek Max Stack
  const { data: invSlot } = await supabase
    .from("user_inventory")
    .select("quantity")
    .eq("discord_id", userId)
    .eq("item_id", itemId)
    .maybeSingle();

  const currentQty = invSlot?.quantity || 0;

  if (item.max_stack && currentQty + quantity > item.max_stack) {
    return {
      success: false,
      message: `📦 **Tas Penuh!**\nBatas maksimal untuk **${item.name}** di tas adalah ${item.max_stack}. (Kamu sudah punya: ${currentQty})`,
    };
  }

  // EKSEKUSI TRANSAKSI

  const { error: errUpdateMoney } = await supabase
    .from("users")
    .update({ t_coin: (user.t_coin || 0) - totalCost })
    .eq("discord_id", userId);

  if (errUpdateMoney)
    return {
      success: false,
      message: "❌ Terjadi kesalahan saat memotong uang.",
    };

  if (invSlot) {
    await supabase
      .from("user_inventory")
      .update({ quantity: currentQty + quantity })
      .eq("discord_id", userId)
      .eq("item_id", itemId);
  } else {
    await supabase.from("user_inventory").insert({
      discord_id: userId,
      item_id: itemId,
      quantity: quantity,
    });
  }

  return {
    success: true,
    message: `🛒 **Transaksi Sukses!**\nKamu membeli **${quantity}x ${item.name}** seharga **${totalCost.toLocaleString("id-ID")} TC**.`,
  };
}

export async function sellItem(
  userId: string,
  itemId: string,
  quantity: number = 1,
) {
  if (quantity < 1)
    return { success: false, message: "❌ Jumlah jual tidak valid!" };

  // Cek Inventory User
  const { data: invSlot } = await supabase
    .from("user_inventory")
    .select("quantity")
    .eq("discord_id", userId)
    .eq("item_id", itemId)
    .maybeSingle();

  if (!invSlot || (invSlot.quantity || 0) < quantity) {
    return {
      success: false,
      message: "❌ Kamu tidak punya item ini dengan jumlah tersebut di tasmu!",
    };
  }

  // Tarik Data Barang
  const { data: item } = await supabase
    .from("master_items")
    .select("name, sell_price")
    .eq("id", itemId)
    .maybeSingle();

  if (!item || !item.sell_price || item.sell_price <= 0) {
    return {
      success: false,
      message: "❌ Barang ini tidak bisa dijual ke Toko.",
    };
  }

  const totalEarned = item.sell_price * quantity;

  // Tarik Data User
  const { data: user } = await supabase
    .from("users")
    .select("t_coin")
    .eq("discord_id", userId)
    .maybeSingle();

  await supabase
    .from("users")
    .update({ t_coin: (user?.t_coin || 0) + totalEarned })
    .eq("discord_id", userId);

  const newQty = (invSlot.quantity || 0) - quantity;
  if (newQty <= 0) {
    await supabase
      .from("user_inventory")
      .delete()
      .eq("discord_id", userId)
      .eq("item_id", itemId);
  } else {
    await supabase
      .from("user_inventory")
      .update({ quantity: newQty })
      .eq("discord_id", userId)
      .eq("item_id", itemId);
  }

  return {
    success: true,
    message: `💵 **Berhasil Menjual!**\nKamu menjual **${quantity}x ${item.name}** dan mendapatkan **${totalEarned.toLocaleString("id-ID")} TC**.`,
  };
}