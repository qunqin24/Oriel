/**
 * 把 vendor-icons.ts 里用到的图标从 @lobehub/icons-static-svg 拷到 public/vendor-icons/。
 *
 * 这是维护脚本，不进日常构建——厂商图标不会每天变，新增厂商映射时手动跑一次：
 *
 *   pnpm sync:icons
 *
 * 大部分厂商本身就是多色品牌标，两个主题下都看得清，直接拷一份 {slug}.svg。
 * VENDOR_ICON_DUAL_TONE 里的厂商没有这种「天然两栖」的版本，构建两份烤死颜色的
 * 文件：{slug}-onlight.svg（深色描边，配浅色主题）和 {slug}-ondark.svg（浅色
 * 描边，配深色主题）。组件用 CSS 的 dark: 变体切换可见性，运行时不用猜主题。
 */
import fs from "node:fs";
import path from "node:path";
import { VENDOR_ICON_DUAL_TONE, VENDOR_ICON_SLUGS } from "../src/lib/vendor-icons.ts";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "node_modules/@lobehub/icons-static-svg/icons");
const DEST = path.join(ROOT, "public/vendor-icons");

// 与 src/styles/global.css 里 --mute 的两个主题取值保持一致——
// 图标烤色要跟旁边的厂商名文字（text-mute）同一个色阶，改配色时两处一起改。
const INK_ON_LIGHT = "#666e79";
const INK_ON_DARK = "#8f9aad";

fs.mkdirSync(DEST, { recursive: true });

function recolor(svg: string, hex: string): string {
  return svg.replaceAll(/fill="currentColor"/g, `fill="${hex}"`);
}

const slugs = new Set(Object.values(VENDOR_ICON_SLUGS));
let written = 0;

for (const slug of slugs) {
  if (VENDOR_ICON_DUAL_TONE.has(slug)) {
    const monoFile = path.join(SRC, `${slug}.svg`);
    if (!fs.existsSync(monoFile)) {
      console.warn(`missing mono icon for dual-tone slug "${slug}" (looked for ${monoFile})`);
      continue;
    }
    const mono = fs.readFileSync(monoFile, "utf8");
    fs.writeFileSync(path.join(DEST, `${slug}-onlight.svg`), recolor(mono, INK_ON_LIGHT));

    // Kimi 的彩色版是它自己的品牌资产（白字 + 蓝点，专为深色底设计），
    // 比烤色的单色版更贴品牌——深色主题下优先用它，不用合成色。
    const colorFile = path.join(SRC, `${slug}-color.svg`);
    const ondark =
      slug === "kimi" && fs.existsSync(colorFile)
        ? fs.readFileSync(colorFile, "utf8")
        : recolor(mono, INK_ON_DARK);
    fs.writeFileSync(path.join(DEST, `${slug}-ondark.svg`), ondark);
    written += 2;
    continue;
  }

  const colorFile = path.join(SRC, `${slug}-color.svg`);
  const monoFile = path.join(SRC, `${slug}.svg`);
  const source = fs.existsSync(colorFile) ? colorFile : monoFile;
  if (!fs.existsSync(source)) {
    console.warn(`missing icon for slug "${slug}" (looked for ${source})`);
    continue;
  }
  fs.copyFileSync(source, path.join(DEST, `${slug}.svg`));
  written++;
}

console.log(`synced ${written} vendor icon file(s) into public/vendor-icons/ (${slugs.size} vendors)`);
