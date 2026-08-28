import { createCanvas, loadImage } from "@napi-rs/canvas";
import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { supabase } from "../../database/supabase.js";

export const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("Tampilkan Kartu Tanda Warga TOWA");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const userId = interaction.user.id;

 
  const { data: user } = await supabase
    .from("users")
    .select(
      "username, t_coin, stamina, bensin, exp, pity_count, total_jukir_count, bg_url",
    )
    .eq("discord_id", userId)
    .maybeSingle();

  if (!user) {
    return interaction.editReply({
      content:
        "❌ Kamu belum terdaftar sebagai warga TOWA! Ketik `/getting-started` terlebih dahulu.",
    });
  }

  // Setup Canvas
  const width = 850;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // BACKGROUND BASE 
  let hasCustomBg = false;
  if (user.bg_url) {
    try {
      const customBg = await loadImage(user.bg_url);
      ctx.drawImage(customBg, 0, 0, width, height);
      hasCustomBg = true;
    } catch {
      hasCustomBg = false;
    }
  }

  if (!hasCustomBg) {
    const defaultBg = ctx.createLinearGradient(0, 0, width, height);
    defaultBg.addColorStop(0, "#1A0900");
    defaultBg.addColorStop(0.5, "#0F0F14");
    defaultBg.addColorStop(1, "#050507");
    ctx.fillStyle = defaultBg;
    ctx.fillRect(0, 0, width, height);

    const radialGlow = ctx.createRadialGradient(100, 100, 10, 100, 100, 300);
    radialGlow.addColorStop(0, "rgba(255, 107, 0, 0.25)");
    radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);
  }

  //GLASSMORPHISM CONTAINER
  ctx.save();
  ctx.fillStyle = hasCustomBg
    ? "rgba(12, 13, 18, 0.65)"
    : "rgba(18, 19, 26, 0.85)";
  ctx.beginPath();
  ctx.roundRect(30, 30, width - 60, height - 60, 24);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  //AVATAR DISCORD WITH ORANGE GLOW BORDER
  const avatarUrl = interaction.user.displayAvatarURL({
    extension: "png",
    size: 256,
  });
  const avatarImg = await loadImage(avatarUrl);

  const avatarX = 70;
  const avatarY = 70;
  const avatarSize = 120;
  const radius = avatarSize / 2;

  ctx.save();
  ctx.shadowColor = "#FF6B00";
  ctx.shadowBlur = 18;
  ctx.strokeStyle = "#FF6B00";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(avatarX + radius, avatarY + radius, radius + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + radius, avatarY + radius, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  // USERNAME & HANDLE 
  const displayName = user.username || interaction.user.username;
  const handleTag = `@${interaction.user.username}`;

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 26px Poppins, sans-serif";
  ctx.fillText(displayName, 215, 110);

  const nameWidth = ctx.measureText(displayName).width;

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "15px Poppins, sans-serif";
  ctx.fillText(handleTag, 215 + nameWidth + 12, 108);

  // Pill Badges 
  const drawPill = (x: number, y: number, text: string, color: string) => {
    ctx.font = "bold 12px Poppins, sans-serif";
    const textWidth = ctx.measureText(text).width;
    const pillWidth = textWidth + 24;
    const pillHeight = 28;

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.roundRect(x, y, pillWidth, pillHeight, 14);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, x + 12, y + 18);
    return pillWidth;
  };

  let pillX = 215;
  pillX += drawPill(pillX, 128, "Warga TOWA", "#FF6B00") + 10;
  drawPill(pillX, 128, "Ojek Pangkalan", "rgba(255, 255, 255, 0.2)");

  // STAT CARDS 

  const drawGlassBox = (x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
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
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
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
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "bold 12px Poppins, sans-serif";
  ctx.fillText("EXP WARGA", 90, 248);

  ctx.fillStyle = "#FF6B00";
  ctx.font = "bold 22px Poppins, sans-serif";
  ctx.fillText(`EXP ${user.exp || 0}`, 90, 280);

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "12px Poppins, sans-serif";
  ctx.fillText(`${user.exp || 0} / 1.000`, 330, 280);

  drawProgressBar(90, 292, 300, 8, user.exp || 0, 1000, "#FF6B00");

  // BALANCE CARD
  drawGlassBox(440, 220, 340, 100);
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "bold 12px Poppins, sans-serif";
  ctx.fillText("DOMPET WARGA", 460, 248);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 24px Poppins, sans-serif";
  ctx.fillText(`${(user.t_coin || 0).toLocaleString("id-ID")} TC`, 460, 285);

  // BOTTOM STATS CARD 
  drawGlassBox(70, 335, 710, 95);

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "12px Poppins, sans-serif";
  ctx.fillText(`Stamina: ${user.stamina || 0}/100`, 95, 365);
  drawProgressBar(95, 375, 200, 6, user.stamina || 0, 100, "#3B82F6");

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText(`Bensin: ${user.bensin || 0}%`, 325, 365);
  drawProgressBar(325, 375, 200, 6, user.bensin || 0, 100, "#EF4444");

  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "bold 13px Poppins, sans-serif";
  ctx.fillText(`Total Jukir: ${user.total_jukir_count || 0}x`, 555, 365);
  ctx.fillText(`Pity Count: ${user.pity_count || 0}`, 555, 395);

  // Footer ID
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.font = "11px Poppins, sans-serif";
  ctx.fillText(`ID: ${userId}`, 650, 450);

  // Send File
  const buffer = canvas.toBuffer("image/png");
  const attachment = new AttachmentBuilder(buffer, {
    name: "profile-towa.png",
  });

  await interaction.editReply({ files: [attachment] });
}
