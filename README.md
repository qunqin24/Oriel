# Oriel

Oriel（奥瑞尔）是一个独立 AI 模型评测站，汇总语言、图像、视频、语音与音乐模型的能力、成本和速度数据。

项目使用 [Astro](https://astro.build/) 构建。页面、路由和静态生成由 Astro 负责，数据表格、图表和模型对比等交互以 React islands 形式按需加载。

## Getting Started

安装依赖并启动开发服务器：

```bash
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321) with your browser to see the result.

常用命令：

```bash
pnpm dev          # 本地开发
pnpm check        # Astro 与 TypeScript 检查
pnpm build        # 生成静态站点到 dist/
pnpm preview      # 预览生产构建
pnpm fetch:data   # 更新评测数据快照
```
