export type LottieValue<T> = T | LottieKeyframe<T>[];

export interface LottieKeyframe<T> {
  t: number;
  s: T;
  e?: T;
  i?: { x: number | number[]; y: number | number[] };
  o?: { x: number | number[]; y: number | number[] };
  h?: 0 | 1;
}

export interface LottieAnimProp<T> {
  a: 0 | 1;
  k: LottieValue<T>;
}

export interface LottiePathData {
  v: [number, number][];
  i: [number, number][];
  o: [number, number][];
  c: boolean;
}

export interface LottieShapeItem {
  ty: string;
  nm?: string;
  ks?: {
    k: LottiePathData;
  };
  p?: { k: [number, number] };
  s?: { k: [number, number] } | LottieAnimProp<number>;
  r?: { k: number };
  c?: { k: [number, number, number, number] };
  o?: { k: number } | LottieAnimProp<number>;
  w?: { k: number };
  lc?: number;
  lj?: number;
  ml?: number;
  it?: LottieShapeItem[];
  e?: LottieAnimProp<number>;
}

export interface LottieTrimItem extends LottieShapeItem {
  ty: 'tm';
  s: LottieAnimProp<number>;
  e: LottieAnimProp<number>;
  o: LottieAnimProp<number>;
}

export interface LottieTransform {
  p: LottieAnimProp<[number, number] | [number, number, number]>;
  s: LottieAnimProp<[number, number] | [number, number, number]>;
  r?: LottieAnimProp<number>;
  rz?: LottieAnimProp<number>;
  a: LottieAnimProp<[number, number] | [number, number, number]>;
  o: LottieAnimProp<number>;
}

export interface LottieLayer {
  ty: number;
  nm?: string;
  ks?: LottieTransform;
  ip: number;
  op: number;
  st: number;
  shapes?: LottieShapeItem[];
  hasMask?: boolean;
  ef?: unknown[];
  bm?: number;
  td?: number;
  tt?: number;
  ao?: number;
  sr?: number;
}

export interface LottieDocument {
  v: string;
  fr: number;
  ip: number;
  op: number;
  w: number;
  h: number;
  layers: LottieLayer[];
  assets?: unknown[];
  chars?: unknown[];
  fonts?: unknown;
}

export interface ConverterOptions {
  mode: 'smil' | 'css';
  pretty?: boolean;
  optimize?: boolean;
}

export interface WarningCollector {
  warn(message: string): void;
}
