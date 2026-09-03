// src/utils/weatherEngine.ts

export type WeatherType = "CERAH" | "HUJAN" | "BADAI" | "CABUT_MALAM";

export interface EnvironmentStatus {
  timeOfDay: "SIANG" | "MALAM";
  weather: WeatherType;
  weatherName: string;
  emoji: string;
  coinMultiplier: number;
  bensinMultiplier: number;
  failRiskBonus: number; 
  storyModifier: string;
}

export function getCurrentEnvironment(): EnvironmentStatus {
  const now = new Date();
  const hour = now.getHours(); 
  const isNight = hour >= 18 || hour < 6;

 
  const timeBlock = Math.floor(now.getTime() / (1000 * 60 * 60 * 3));
  const weatherSeed = timeBlock % 4;

  let weather: WeatherType = "CERAH";
  let weatherName = "Cerah Berawan";
  let emoji = "☀️";
  let coinMultiplier = 1.0;
  let bensinMultiplier = 1.0;
  let failRiskBonus = 0;
  let storyModifier = "";

  if (isNight) {
    if (weatherSeed === 1) {
      weather = "CABUT_MALAM";
      weatherName = "Kabut Malam Pekat";
      emoji = "🌫️";
      coinMultiplier = 1.3;
      bensinMultiplier = 1.1;
      failRiskBonus = 0.15;
      storyModifier =
        "Jalanan malam yang berkabut tebal membuat jarak pandang terbatas!";
    } else {
      weatherName = "Malam Syahdu";
      emoji = "🌙";
      coinMultiplier = 1.1;
      storyModifier =
        "Angin malam berhembus sepoi-sepoi mengiringi perjalananmu.";
    }
  } else {
    if (weatherSeed === 2) {
      weather = "HUJAN";
      weatherName = "Hujan Deras (Surge Pricing)";
      emoji = "🌧️";
      coinMultiplier = 1.5; 
      bensinMultiplier = 1.3; 
      failRiskBonus = 0.1;
      storyModifier =
        "Hujan deras mengguyur jalanan TOWA District, argo ojek otomatis naik tajam!";
    } else if (weatherSeed === 3) {
      weather = "BADAI";
      weatherName = "Badai Petir & Angin Kencang";
      emoji = "🌩️";
      coinMultiplier = 2.0; 
      bensinMultiplier = 1.5;
      failRiskBonus = 0.25;
      storyModifier =
        "Petir menyambar-nyambar! Cuma driver pemberani yang nekat narik saat ini!";
    } else {
      weatherName = "Cerah Terik";
      emoji = "☀️";
      coinMultiplier = 1.0;
      storyModifier = "Matahari terik menyinari TOWA District.";
    }
  }

  return {
    timeOfDay: isNight ? "MALAM" : "SIANG",
    weather,
    weatherName,
    emoji,
    coinMultiplier,
    bensinMultiplier,
    failRiskBonus,
    storyModifier,
  };
}
