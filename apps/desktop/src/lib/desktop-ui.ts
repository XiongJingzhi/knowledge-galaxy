import type { DocumentFilters, NavSection } from "./types";

export type ActivityItem = {
  title: string;
  detail: string;
  note?: string;
};

export type OverviewCard = {
  label: string;
  value: string;
  accent: "signal" | "ink" | "muted" | "soft";
};

export type SectionHeroAction = {
  label: string;
  kind: "primary" | "ghost";
  onClick: () => void;
};

export type SectionHeroData = {
  eyebrow: string;
  title: string;
  description: string;
  actions: SectionHeroAction[];
};

export type DocumentSignal = {
  group: string;
  title: string;
  actionLabel: string;
  key: string;
  count: number;
  filterKey: keyof DocumentFilters;
};

export const sectionDeskCopy: Record<NavSection, { title: string; description: string }> = {
  home: {
    title: "首页",
    description: "搜索内容、查看仓库概况并进入常用操作。",
  },
  documents: {
    title: "文档",
    description: "查看、筛选并编辑当前知识库中的文档。",
  },
  assets: {
    title: "资源",
    description: "浏览资源文件，管理仓库级和项目级作用域。",
  },
  ops: {
    title: "校验与导出",
    description: "检查仓库状态并生成可保存的导出结果。",
  },
  projects: {
    title: "项目",
    description: "联动知识项目和代码仓库的远端操作。",
  },
};
