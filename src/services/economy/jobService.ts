
import { getCurrentRank } from "../../config/jobRanks.js";
import { supabase } from "../../database/supabase.js";
import { getCurrentEnvironment } from "../../utils/weatherEngine.js";

const BASE_COST = {
  OJEK_BENSIN: 10,
  OJEK_STAMINA: 15,
};


export type PrepareNgojekResult = {
  success: boolean;
  reason?:
    | "NOT_REGISTERED"
    | "WRONG_JOB"
    | "NO_HELMET"
    | "COOLDOWN"
    | "LOW_BENSIN"
    | "LOW_STAMINA";
  message?: string;
  user?: any;
  rank?: any;
  env?: any;
  hasDrag?: boolean;
  inventoryContext?: {
    bensinCount: number;
    nasiTelurCount: number;
  };
};

/**
 * Validasi Persyaratan Ngojek, Equipment, & Buffs
 */
export async function prepareNgojek(
  userId: string,
): Promise<PrepareNgojekResult> {
  // 1. Tarik Data User
  const { data: user, error } = await supabase
    .from("users")
    .select(
      "job, t_coin, stamina, bensin, exp, total_ojek_count, last_ngojek, buff_rokok_charges, buff_kopi_expires",
    )
    .eq("discord_id", userId)
    .maybeSingle();

  if (error || !user) {
    return {
      success: false,
      reason: "NOT_REGISTERED",
      message: "❌ Kamu belum terdaftar sebagai warga TOWA!",
    };
  }

  if (user.job !== "Driver Magang") {
    return {
      success: false,
      reason: "WRONG_JOB",
      message:
        "❌ Pekerjaanmu bukan Driver Magang! Kamu tidak punya akses ke TOWA Driver.",
    };
  }

  //  Cek Equipment & Consumables (1x Query untuk Semua!)
  const { data: inventory } = await supabase
    .from("user_inventory")
    .select("item_id, quantity")
    .eq("discord_id", userId);

  const hasBogo = inventory?.some(
    (i) => i.item_id === "item_helm_bogo" && (i.quantity ?? 0) > 0,
  );
  const hasDrag = inventory?.some(
    (i) => i.item_id === "item_helm_drag" && (i.quantity ?? 0) > 0,
  );
  const hasHelmRusak = inventory?.some(
    (i) => i.item_id === "item_helm_rusak" && (i.quantity ?? 0) > 0,
  );

  // Ambil sisa item konsumsi dari memori 
  const bensinCount =
    inventory?.find((i) => i.item_id === "item_bensin")?.quantity ?? 0;
  const nasiTelurCount =
    inventory?.find((i) => i.item_id === "item_nasitelur")?.quantity ?? 0;
  const inventoryContext = { bensinCount, nasiTelurCount };

  if (!hasBogo && !hasDrag) {
    if (hasHelmRusak) {
      return {
        success: false,
        reason: "NO_HELMET",
        message:
          "🪖 **Helmu Rusak Total!** Servis dulu menggunakan `Sparepart Motor` & `Oli Bekas` di bengkel!",
      };
    }
    return {
      success: false,
      reason: "NO_HELMET",
      message:
        "🪖 **Kamu tidak punya Helm!** Beli `Helm Bogo` terlebih dahulu di Shop untuk mulai ngojek.",
    };
  }

  // Hitung Cooldown & Buff Stacking
  const currentTotalOjek = user.total_ojek_count || 0;
  const rank = getCurrentRank("OJEK", currentTotalOjek);

  let effectiveCooldown = rank.cooldownMins;
  let activeBuffs: string[] = [];

  if (hasDrag) {
    effectiveCooldown *= 0.5;
    activeBuffs.push("⚡Helm Drag");
  }

  if (user.buff_kopi_expires) {
    const kopiExpires = new Date(user.buff_kopi_expires).getTime();
    if (Date.now() < kopiExpires) {
      effectiveCooldown *= 0.7;
      activeBuffs.push("☕Kopi Susu");
    }
  }

  const hasRokokBuff = (user.buff_rokok_charges ?? 0) > 0;
  if (hasRokokBuff) {
    effectiveCooldown *= 0.8;
    activeBuffs.push("🚬Rokok");
  }

  // Validasi Cooldown
  if (user.last_ngojek) {
    const lastTime = new Date(user.last_ngojek).getTime();
    const now = Date.now();
    const diffMins = (now - lastTime) / (1000 * 60);

    if (diffMins < effectiveCooldown) {
      const timeLeft = Math.ceil(effectiveCooldown - diffMins);
      const buffText =
        activeBuffs.length > 0
          ? `\n*Active Buffs: ${activeBuffs.join(", ")}*`
          : "";
      return {
        success: false,
        reason: "COOLDOWN",
        message: `⏳ Mesin motormu panas, **${rank.title}**! ${buffText}\nTunggu **${timeLeft} menit** lagi.`,
      };
    }
  }

  //  Validasi Cuaca & Cost
  const env = getCurrentEnvironment();
  const requiredBensin = Math.floor(
    BASE_COST.OJEK_BENSIN * env.bensinMultiplier,
  );

  if ((user.bensin || 0) < requiredBensin) {
    return {
      success: false,
      reason: "LOW_BENSIN",
      message: `⛽ **Bensin Tidak Cukup!** Cuaca ${env.emoji} (${env.weatherName}) butuh **${requiredBensin}% Bensin**.`,
      inventoryContext,
    };
  }
  if ((user.stamina || 0) < BASE_COST.OJEK_STAMINA) {
    return {
      success: false,
      reason: "LOW_STAMINA",
      message: `⚡ **Stamina Habis!** (Butuh ${BASE_COST.OJEK_STAMINA}).`,
      inventoryContext,
    };
  }

  return { success: true, user, rank, env, hasDrag, inventoryContext };
}

export type ExecuteNgojekResult = {
  success: boolean;
  message?: string;
  earnedTC?: number;
  earnedExp?: number;
  newBensin?: number;
  newStamina?: number;
  newTotalOjek?: number;
  rankName?: string;
  droppedItem?: { id: string; name: string } | null;
};

export async function executeNgojek(
  userId: string,
  isSuccess: boolean,
  routeMultiplier: number,
  envMultiplier: number,
): Promise<ExecuteNgojekResult> {
  const { data: user } = await supabase
    .from("users")
    .select(
      "t_coin, stamina, bensin, exp, total_ojek_count, buff_rokok_charges",
    )
    .eq("discord_id", userId)
    .maybeSingle();

  if (!user) return { success: false, message: "Data tidak ditemukan." };

  const currentTotalOjek = user.total_ojek_count || 0;
  const rank = getCurrentRank("OJEK", currentTotalOjek);

  let earnedTC = 0;
  let earnedExp = 5;

  if (isSuccess) {
    const baseCoin =
      Math.floor(Math.random() * (rank.maxCoin - rank.minCoin + 1)) +
      rank.minCoin;
    earnedTC = Math.floor(baseCoin * routeMultiplier * envMultiplier);
    earnedExp = rank.expReward;
  }

  const env = getCurrentEnvironment();
  const bensinUsed = Math.floor(BASE_COST.OJEK_BENSIN * env.bensinMultiplier);
  const newBensin = Math.max(0, (user.bensin || 0) - bensinUsed);
  const newStamina = Math.max(0, (user.stamina || 0) - BASE_COST.OJEK_STAMINA);


  const newRokokCharges = Math.max(0, (user.buff_rokok_charges ?? 0) - 1);

  // DROP ITEM SYSTEM 
  let droppedItem: { id: string; name: string } | null = null;
  const lootRoll = Math.random();

  if (lootRoll < 0.05)
    droppedItem = { id: "item_oli_bekas", name: "🛢️ Oli Bekas (Rare)" };
  else if (lootRoll < 0.15)
    droppedItem = { id: "item_ban_dalam", name: "⚙️ Ban Dalam Bekas" };
  else if (lootRoll < 0.3)
    droppedItem = { id: "item_busi_bekas", name: "🔧 Busi Bekas" };

  if (droppedItem) {
    const { data: existingSlot } = await supabase
      .from("user_inventory")
      .select("quantity")
      .eq("discord_id", userId)
      .eq("item_id", droppedItem.id)
      .maybeSingle();

    if (existingSlot) {
      await supabase
        .from("user_inventory")
        .update({ quantity: (existingSlot.quantity ?? 0) + 1 })
        .eq("discord_id", userId)
        .eq("item_id", droppedItem.id);
    } else {
      await supabase.from("user_inventory").insert({
        discord_id: userId,
        item_id: droppedItem.id,
        quantity: 1,
      });
    }
  }

  // Save State User
  const { error } = await supabase
    .from("users")
    .update({
      t_coin: (user.t_coin || 0) + earnedTC,
      exp: (user.exp || 0) + earnedExp,
      bensin: newBensin,
      stamina: newStamina,
      buff_rokok_charges: newRokokCharges,
      total_ojek_count: currentTotalOjek + 1,
      last_ngojek: new Date().toISOString(),
    })
    .eq("discord_id", userId);

  if (error) return { success: false, message: "Gagal memperbarui database." };

  return {
    success: true,
    earnedTC,
    earnedExp,
    newBensin,
    newStamina,
    newTotalOjek: currentTotalOjek + 1,
    rankName: rank.title,
    droppedItem,
  };
}
