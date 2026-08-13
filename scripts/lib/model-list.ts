import type { LanguageModel } from "../../src/lib/types.ts";

export type NormalizedModelList = {
  models: LanguageModel[];
  duplicateIds: string[];
};

/**
 * 分页接口偶尔会在相邻页面重复返回同一个模型。按稳定 id 去重，避免同一个
 * slug 被 Astro 当成两条路由；真正的 slug 冲突则拒绝继续，因为两个不同
 * 模型不能静默共用一个详情页。
 */
export function normalizeModelList(
  input: LanguageModel[]
): NormalizedModelList {
  const byId = new Map<string, LanguageModel>();
  const duplicateIds = new Set<string>();

  for (const model of input) {
    if (!model.id) throw new Error("Artificial Analysis 返回了缺少 id 的模型");
    if (!model.slug) {
      throw new Error(`Artificial Analysis 返回了缺少 slug 的模型: ${model.id}`);
    }

    const previous = byId.get(model.id);
    if (previous && previous.slug !== model.slug) {
      throw new Error(
        `同一个模型 id 返回了不同 slug: ${model.id} (${previous.slug} / ${model.slug})`
      );
    }
    if (previous) duplicateIds.add(model.id);

    // 同一轮分页里后返回的记录更新，保留后一份。
    byId.set(model.id, model);
  }

  const models = [...byId.values()];
  const slugOwners = new Map<string, LanguageModel>();
  for (const model of models) {
    const owner = slugOwners.get(model.slug);
    if (owner && owner.id !== model.id) {
      throw new Error(
        `不同模型共用了 slug "${model.slug}": ${owner.id} (${owner.name}) / ` +
          `${model.id} (${model.name})`
      );
    }
    slugOwners.set(model.slug, model);
  }

  return { models, duplicateIds: [...duplicateIds].sort() };
}
