// src/config/jobRanks.ts

export type RankConfig = {
  title: string;
  minCount: number;
  cooldownMins: number;
  minCoin: number;
  maxCoin: number;
  expReward: number;
};

export const OJEK_RANKS: RankConfig[] = [
  {
    title: "Driver Magang",
    minCount: 0,
    cooldownMins: 15,
    minCoin: 150,
    maxCoin: 250,
    expReward: 20,
  },
  {
    title: "Driver Junior",
    minCount: 50,
    cooldownMins: 12,
    minCoin: 200,
    maxCoin: 350,
    expReward: 25,
  },
  {
    title: "Driver Senior",
    minCount: 200,
    cooldownMins: 10,
    minCoin: 300,
    maxCoin: 500,
    expReward: 35,
  },
  {
    title: "Sesepuh Aspal",
    minCount: 500,
    cooldownMins: 5,
    minCoin: 500,
    maxCoin: 800,
    expReward: 50,
  },
];

export const JUKIR_RANKS: RankConfig[] = [
  {
    title: "Jukir Ingusan",
    minCount: 0,
    cooldownMins: 15,
    minCoin: 100,
    maxCoin: 200,
    expReward: 15,
  },
  {
    title: "Jukir Piawai",
    minCount: 60,
    cooldownMins: 12,
    minCoin: 150,
    maxCoin: 300,
    expReward: 20,
  },
  {
    title: "Jukir Legend",
    minCount: 220,
    cooldownMins: 10,
    minCoin: 250,
    maxCoin: 450,
    expReward: 30,
  },
  {
    title: "Preman Kawasan",
    minCount: 500,
    cooldownMins: 5,
    minCoin: 400,
    maxCoin: 700,
    expReward: 45,
  },
];

export const MANCING_RANKS: RankConfig[] = [
  {
    title: "Pemancing Amatir",
    minCount: 0,  
    cooldownMins: 20,
    minCoin: 0,
    maxCoin: 0,
    expReward: 15,
  },
  {
    title: "Pemancing Handal",
    minCount: 50,
    cooldownMins: 15,
    minCoin: 0,
    maxCoin: 0,
    expReward: 20,
  },
  {
    title: "Pemancing Ulung",
    minCount: 130,
    cooldownMins: 12,
    minCoin: 0,
    maxCoin: 0,
    expReward: 20,
  },
  {
    title: "Penguasa Lautan",
    minCount: 200,
    cooldownMins: 10,
    minCoin: 0,
    maxCoin: 0,
    expReward: 30,
  },
];

/**
 * Mengambil konfigurasi pangkat saat ini 
 */
export function getCurrentRank(
  jobType: "OJEK" | "JUKIR" | "MANCING",
  count: number,
): RankConfig {
  let ranks: RankConfig[];

  if (jobType === "OJEK") ranks = OJEK_RANKS;
  else if (jobType === "JUKIR") ranks = JUKIR_RANKS;
  else ranks = MANCING_RANKS;

  // Di-reverse dari besar ke kecil agar menemukan minCount terbesar yang terpenuhi
  const current = [...ranks].reverse().find((r) => count >= r.minCount);
  return current || ranks[0];
}
