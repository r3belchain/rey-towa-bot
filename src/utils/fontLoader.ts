import { GlobalFonts } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";

export function loadFonts(): void {
  const fontsDir = path.join(process.cwd(), "src", "assets", "fonts");

  const fontBoldPath = path.join(fontsDir, "Poppins-Bold.ttf");
  const fontRegularPath = path.join(fontsDir, "Poppins-Regular.ttf");

  if (!fs.existsSync(fontBoldPath) || !fs.existsSync(fontRegularPath)) {
    console.warn(
      "⚠️ File font Poppins tidak ditemukan di src/assets/fonts! Menggunakan font sistem fallback.",
    );
    return;
  }

  GlobalFonts.registerFromPath(fontBoldPath, "Poppins");
  GlobalFonts.registerFromPath(fontRegularPath, "Poppins");

  console.log(
    "🎨 Font Poppins (Bold & Regular) berhasil dimuat ke Canvas Registry.",
  );
}
