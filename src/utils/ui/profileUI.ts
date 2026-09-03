// src/utils/ui/profileUI.ts
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { AttachmentBuilder, User } from "discord.js";
import { getCurrentRank } from "../../config/jobRanks.js";

/**
 * load Avatar Discord with timeout, fallback to default avatar if failed
 */
async function loadSafeImage(url: string, timeoutMs: number = 3000) {
  return Promise.race([
    loadImage(url),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Image Load Timeout")), timeoutMs),
    ),
  ]);
}

/**
 * Create a profile card image for a user
 */
export async function buildProfileCard(userData: any, discordUser: User) {
  const width = 850;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // --- BACKGROUND LAYER ---
  const defaultBg = ctx.createLinearGradient(0, 0, width, height);
  defaultBg.addColorStop(0, "#F5C249");
  defaultBg.addColorStop(1, "#D08F1E");
  ctx.fillStyle = defaultBg;
  ctx.fillRect(0, 0, width, height);

  const radialGlow = ctx.createRadialGradient(
    width / 2,
    height / 2,
    50,
    width / 2,
    height / 2,
    600,
  );
  radialGlow.addColorStop(0, "rgba(255, 255, 255, 0.2)");
  radialGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  // GLASSMORPHISM CONTAINER
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.90)";
  ctx.beginPath();
  ctx.roundRect(30, 30, width - 60, height - 60, 24);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 1)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // AVATAR DISCORD
  let avatarImg;
  try {
    const avatarUrl = discordUser.displayAvatarURL({
      extension: "png",
      size: 256,
    });
    avatarImg = await loadSafeImage(avatarUrl);
  } catch {
    avatarImg = await loadImage(
      "https://cdn.discordapp.com/embed/avatars/0.png",
    );
  }

  const avatarX = 70;
  const avatarY = 70;
  const avatarSize = 120;
  const radius = avatarSize / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 5;
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(avatarX + radius, avatarY + radius, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + radius, avatarY + radius, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  // --- USERNAME & HANDLE ---
  const displayName = userData.username || discordUser.username;
  const handleTag = `@${discordUser.username}`;

  ctx.fillStyle = "#2C1E0C";
  ctx.font = "bold 26px Poppins, sans-serif";
  ctx.fillText(displayName, 215, 110);

  const nameWidth = ctx.measureText(displayName).width;

  ctx.fillStyle = "rgba(44, 30, 12, 0.55)";
  ctx.font = "15px Poppins, sans-serif";
  ctx.fillText(handleTag, 215 + nameWidth + 12, 108);

  // --- PILL BADGES UTILS ---
  const drawPill = (
    x: number,
    y: number,
    text: string,
    bgColor: string,
    textColor: string,
  ) => {
    ctx.font = "bold 12px Poppins, sans-serif";
    const textWidth = ctx.measureText(text).width;
    const pillWidth = textWidth + 24;
    const pillHeight = 28;

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x, y, pillWidth, pillHeight, 14);
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.fillText(text, x + 12, y + 18);
    return pillWidth;
  };

  let pillX = 215;
  pillX +=
    drawPill(pillX, 128, "Warga TOWA", "rgba(232, 163, 30, 0.15)", "#D07C00") +
    10;

  // LOGIKA PANGKAT & WARNA DINAMIS 
  const baseJob = userData.job || "Pengangguran";

  let displayTitle = baseJob;
  let jobBgColor = "rgba(0, 0, 0, 0.05)";
  let jobTextColor = "rgba(44, 30, 12, 0.7)";
  let jobStatText = "Aktivitas: Belum Ada";

  if (baseJob === "Driver Ojek" || baseJob === "Driver Magang") {
    const rank = getCurrentRank("OJEK", userData.total_ojek_count || 0);
    displayTitle = rank.title;
    jobBgColor = "rgba(59, 130, 246, 0.15)";
    jobTextColor = "#2c6a41";
    jobStatText = `Total Narik: ${userData.total_ojek_count || 0}x`;
  } else if (baseJob === "Jukir Pemula" || baseJob === "Jukir Ingusan") {
    const rank = getCurrentRank("JUKIR", userData.total_jukir_count || 0);
    displayTitle = rank.title;
    jobBgColor = "rgba(16, 185, 129, 0.15)";
    jobTextColor = "#1395e7";
    jobStatText = `Total Markir: ${userData.total_jukir_count || 0}x`;
  } else if (baseJob === "Pemancing" || baseJob === "Pemancing Amatir") {
    const rank = getCurrentRank("MANCING", userData.total_mancing_count || 0);
    displayTitle = rank.title;
    jobBgColor = "rgba(139, 92, 246, 0.15)";
    jobTextColor = "#d8ef0b";
    jobStatText = `Total Mancing: ${userData.total_mancing_count || 0}x`;
  }

  // Render Pill Badge Pangkat
  drawPill(pillX, 128, displayTitle, jobBgColor, jobTextColor);

  // STAT CARDS UTILS 
  const drawGlassBox = (x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.04)";
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawProgressBar = (
    x: number,
    y: number,
    w: number,
    h: number,
    val: number,
    max: number,
    fillColor: string,
  ) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, h / 2);
    ctx.fill();
    const currentW = Math.max(0, Math.min(w, (w * val) / max));
    if (currentW > 0) {
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.roundRect(x, y, currentW, h, h / 2);
      ctx.fill();
    }
  };

  // EXP CARD 
  drawGlassBox(70, 220, 340, 100);
  ctx.fillStyle = "rgba(44, 30, 12, 0.5)";
  ctx.font = "bold 12px Poppins, sans-serif";
  ctx.fillText("EXP WARGA", 90, 248);

  ctx.fillStyle = "#D07C00";
  ctx.font = "bold 22px Poppins, sans-serif";
  ctx.fillText(`EXP ${userData.exp || 0}`, 90, 280);

  ctx.fillStyle = "rgba(44, 30, 12, 0.4)";
  ctx.font = "12px Poppins, sans-serif";
  ctx.fillText(`${userData.exp || 0} / 1.000`, 330, 280);
  drawProgressBar(90, 292, 300, 8, userData.exp || 0, 1000, "#E8A31E");

  // BALANCE CARD 
  drawGlassBox(440, 220, 340, 100);
  ctx.fillStyle = "rgba(44, 30, 12, 0.5)";
  ctx.font = "bold 12px Poppins, sans-serif";
  ctx.fillText("DOMPET WARGA", 460, 248);

  ctx.fillStyle = "#2C1E0C";
  ctx.font = "bold 24px Poppins, sans-serif";
  ctx.fillText(
    `${(userData.t_coin || 0).toLocaleString("id-ID")} TC`,
    460,
    285,
  );

  // BOTTOM STATS CARD 
  drawGlassBox(70, 335, 710, 95);
  ctx.fillStyle = "rgba(44, 30, 12, 0.8)";
  ctx.font = "12px Poppins, sans-serif";

  ctx.fillText(`Stamina: ${userData.stamina || 0}/100`, 95, 365);
  drawProgressBar(95, 375, 200, 6, userData.stamina || 0, 100, "#3B82F6");

  ctx.fillText(`Bensin: ${userData.bensin || 0}%`, 325, 365);
  drawProgressBar(325, 375, 200, 6, userData.bensin || 0, 100, "#EF4444");

  ctx.fillStyle = "#2C1E0C";
  ctx.font = "bold 13px Poppins, sans-serif";

  ctx.fillText(jobStatText, 555, 365);
  ctx.fillText(`Pity Count: ${userData.pity_count || 0}`, 555, 395);

  // FOOTER 
  ctx.fillStyle = "rgba(44, 30, 12, 0.35)";
  ctx.font = "11px Poppins, sans-serif";
  ctx.fillText(`ID: ${discordUser.id}`, 650, 450);

  // EXPORT TO ATTACHMENT
  const buffer = canvas.toBuffer("image/png");
  return new AttachmentBuilder(buffer, { name: "profile-towa.png" });
}
