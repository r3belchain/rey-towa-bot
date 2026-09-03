// src/services/economy/userService.ts
import { supabase } from "../../database/supabase.js";

/**
 * Get profile user with userId from database.
 */
export async function getUserData(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select(
      "username, t_coin, stamina, bensin, exp, pity_count, total_jukir_count, bg_url, job",
    )
    .eq("discord_id", userId)
    .maybeSingle();

  return { user: data, error };
}

