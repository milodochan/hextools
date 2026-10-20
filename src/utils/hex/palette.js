/**
 * palette.js —— 字段配色表（hex 视图 / 解析结果共用）。
 *
 * 注意：这些类名必须是【字面量】。Tailwind v4 在构建期扫描源码生成样式，
 * 运行时拼接出来的动态类名会被直接裁剪掉，所以这里用数组常量把候选类全部固化。
 */

/** 与 utils/hex/parser.js 的 PALETTE_LEN 保持一致 */
export const PALETTE_LEN = 10

/** 字段底色：hex 视图中按字段索引给字节着色（浅色 / 暗色各一档） */
export const FIELD_BG = [
    'bg-sky-500/20 dark:bg-sky-500/30',
    'bg-emerald-500/20 dark:bg-emerald-500/30',
    'bg-amber-500/20 dark:bg-amber-500/30',
    'bg-rose-500/20 dark:bg-rose-500/30',
    'bg-violet-500/20 dark:bg-violet-500/30',
    'bg-teal-500/20 dark:bg-teal-500/30',
    'bg-orange-500/20 dark:bg-orange-500/30',
    'bg-indigo-500/20 dark:bg-indigo-500/30',
    'bg-lime-500/20 dark:bg-lime-500/30',
    'bg-fuchsia-500/20 dark:bg-fuchsia-500/30'
]

/** 字段实色：解析结果表字段名前的色点 */
export const FIELD_SOLID = [
    'bg-sky-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-violet-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-indigo-500',
    'bg-lime-500',
    'bg-fuchsia-500'
]
