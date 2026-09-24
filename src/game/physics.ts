import type { Rect } from './types.ts'

export const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))
