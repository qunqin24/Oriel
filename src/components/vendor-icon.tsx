import { vendorIconSlug, vendorInitial, VENDOR_ICON_DUAL_TONE } from "@/lib/vendor-icons";

/**
 * vendor-icon.astro 的 React 版本——island 里不能 import .astro 组件，
 * 逻辑和取色都对齐，唯一的共享事实来源是 lib/vendor-icons.ts。
 */
type Props = {
  name: string;
  size?: number;
  className?: string;
};

export default function VendorIcon({ name, size = 14, className }: Props) {
  const slug = vendorIconSlug(name);

  if (slug && VENDOR_ICON_DUAL_TONE.has(slug)) {
    // <img src="*.svg"> 加载的 SVG 不继承页面的 color，currentColor 救不了——
    // 两份烤好颜色的文件都渲染出来，用 dark: 切可见性，和主题按钮的太阳/
    // 月亮图标同一个套路，不用等 JS 判断主题。
    const shared = `shrink-0 object-contain align-middle ${className ?? ""}`;
    return (
      <>
        <img
          src={`/vendor-icons/${slug}-onlight.svg`}
          width={size}
          height={size}
          alt=""
          loading="lazy"
          className={`${shared} dark:hidden`}
        />
        <img
          src={`/vendor-icons/${slug}-ondark.svg`}
          width={size}
          height={size}
          alt=""
          loading="lazy"
          className={`hidden ${shared} dark:inline-block`}
        />
      </>
    );
  }

  if (slug) {
    return (
      <img
        src={`/vendor-icons/${slug}.svg`}
        width={size}
        height={size}
        alt=""
        loading="lazy"
        className={`inline-block shrink-0 object-contain align-middle ${className ?? ""}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-rule bg-panel align-middle text-mute ${className ?? ""}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.58) }}
      aria-hidden="true"
    >
      {vendorInitial(name)}
    </span>
  );
}
