import { supabase } from "../../database/supabase.js";

/**
 * Check if a user with the given userId is already registered in the database.
 */
export async function checkExistingUser(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("discord_id")
    .eq("discord_id", userId)
    .maybeSingle();

  return { isRegistered: !!data, error };
}

/**
 * Register a new user in the database with the given userId, username, and chosenPath.
 */
export async function registerNewUser(
  userId: string,
  username: string,
  chosenPath: string,
) {
  // Setup Starter Pack
  const starterItems = [];
  let packDescription = "";
  let jobName = "Pengangguran";

  if (chosenPath === "path_ojek") {
    jobName = "Driver Magang";
    starterItems.push({
      discord_id: userId,
      item_id: "item_helm_bogo",
      quantity: 1,
    });
    starterItems.push({
      discord_id: userId,
      item_id: "item_bensin",
      quantity: 10,
    });
    packDescription = "🪖 1x Helm Bogo & ⛽ 10x Pertalite";
  } else if (chosenPath === "path_jukir") {
    jobName = "Jukir Ingusan";
    starterItems.push({
      discord_id: userId,
      item_id: "item_peluit_parkir",
      quantity: 1,
    });
    starterItems.push({
      discord_id: userId,
      item_id: "item_esteh",
      quantity: 2,
    });
    packDescription = "🎺 1x Peluit Parkir & 🥤 2x Es Teh Manis";
  } else if (chosenPath === "path_mancing") {
    jobName = "Pemancing Amatir";
    starterItems.push({
      discord_id: userId,
      item_id: "item_kail_bambu",
      quantity: 1,
    });
    starterItems.push({
      discord_id: userId,
      item_id: "item_umpan",
      quantity: 5,
    });
    packDescription = "🎣 1x Kail Bambu & 🪱 5x Umpan Cacing";
  }

  // Insert ke tabel users
  const { error: userError } = await supabase.from("users").insert({
    discord_id: userId,
    username: username,
    job: jobName,
    t_coin: 500,
    stamina: 100,
    pity_count: 0,
    bensin: 100,
    exp: 0,
  });

  if (userError)
    return { success: false, message: "Gagal menyimpan data ke database." };

  // Insert ke inventory
  if (starterItems.length > 0) {
    const { error: invError } = await supabase
      .from("user_inventory")
      .insert(starterItems);
    if (invError)
      console.error("Gagal insert inventory starter pack:", invError);
  }

  return { success: true, packDescription };
}
