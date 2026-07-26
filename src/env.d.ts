/// <reference types="astro/client" />

interface Window {
  /** 防止 models.astro 的 before-swap 监听重复注册。 */
  __orielExplorerPending?: boolean;
}
