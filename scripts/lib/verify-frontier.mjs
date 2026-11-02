/**
 * 验证静态前沿图完整渲染了本次快照中可绘制的模型。
 * 指数换版后有分数的模型数会变，不能把历史覆盖量当作渲染契约。
 * 独立从原始数据推导期望，不复用组件的 frontier()，以免漏画时一起漏算。
 */
export function inspectFrontier(html, models) {
  const expected = models.filter(
    (model) =>
      model.release_date &&
      Number.isFinite(Date.parse(model.release_date)) &&
      Number.isFinite(model.evaluations?.artificial_analysis_intelligence_index)
  ).length;

  const svg = html.match(
    /<svg\b[^>]*\saria-labelledby="frontier-title frontier-desc"[^>]*>[\s\S]*?<\/svg>/
  )?.[0] ?? "";
  // 只数模型点，不包括领先者的装饰圆环、主题按钮或页面上的其它 SVG。
  const points = [...svg.matchAll(/<circle\b[^>]*>/g)]
    .map(([circle]) => circle)
    .filter((circle) => /\sdata-frontier-point(?:\s|=|\/?>)/.test(circle));
  const finiteCoordinates = points.every((circle) =>
    ["cx", "cy"].every((attribute) => {
      const value = circle.match(new RegExp(`\\s${attribute}="([^"]+)"`))?.[1];
      return value != null && value.trim() !== "" && Number.isFinite(Number(value));
    })
  );

  return {
    expected,
    actual: points.length,
    ok:
      // 上游整榜缺失仍然失败，不能让「0 === 0」放过坏快照。
      expected > 0 &&
      svg.includes('viewBox="0 0 900 340"') &&
      points.length === expected &&
      finiteCoordinates,
  };
}
