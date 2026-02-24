import { extractPath, lottiePathToSvgD } from '../converters/shape.js';
import { buildTransform } from '../converters/transform.js';
import { buildTrimPresentation } from '../converters/trim.js';
import { LottieDocument, LottieLayer, LottieShapeItem, LottieTrimItem, WarningCollector } from '../types/lottie.js';
import { estimatePathLength } from '../utils/path-length.js';
import { buildEmbeddedAnimatorScript } from './js-animator.js';

interface BuildOptions {
  warnings: WarningCollector;
}

function unsupportedLayerWarnings(layer: LottieLayer, warnings: WarningCollector): void {
  if (layer.ty !== 4) warnings.warn(`Layer "${layer.nm ?? 'unnamed'}" type ${layer.ty} is unsupported (only shape layers are supported).`);
  if (layer.ef?.length) warnings.warn(`Layer "${layer.nm ?? 'unnamed'}" contains effects which are ignored.`);
  if (layer.hasMask || layer.tt || layer.td) warnings.warn(`Layer "${layer.nm ?? 'unnamed'}" uses masks/mattes which are ignored.`);
  if (layer.bm) warnings.warn(`Layer "${layer.nm ?? 'unnamed'}" uses blend mode which is ignored.`);
}

function shapeWarnings(item: LottieShapeItem, warnings: WarningCollector): void {
  if (['rp', 'mm', 'gf', 'gs', 'fl', 'st'].includes(item.ty)) return;
  if (!['gr', 'sh', 'rc', 'el', 'tm', 'tr'].includes(item.ty)) {
    warnings.warn(`Shape item type "${item.ty}" is unsupported and ignored.`);
  }
}

export function buildSvg(doc: LottieDocument, options: BuildOptions): string {
  const lines: string[] = [];
  const animItems: string[] = [];

  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${doc.w} ${doc.h}" width="${doc.w}" height="${doc.h}">`);

  for (const [layerIndex, layer] of doc.layers.entries()) {
    unsupportedLayerWarnings(layer, options.warnings);
    if (layer.ty !== 4 || !layer.shapes) continue;

    const transform = buildTransform(layer.ks, doc.fr);
    lines.push(`<g transform="${transform.transform}" opacity="${transform.opacity}" transform-origin="${transform.origin}">`);

    const currentTrim = layer.shapes.find((item) => item.ty === 'tm' && 'e' in item && 's' in item && 'o' in item) as LottieTrimItem | undefined;

    for (const [shapeIndex, item] of layer.shapes.entries()) {
      shapeWarnings(item, options.warnings);
      if (item.ty === 'tm') continue;

      const path = extractPath(item);
      if (!path) continue;

      const id = `trim_path_${layerIndex}_${shapeIndex}`;
      const d = lottiePathToSvgD(path);
      let dasharray = 0;
      let dashoffset = 0;

      if (currentTrim) {
        const pathLength = estimatePathLength(path);
        const trim = buildTrimPresentation(currentTrim);
        const span = Math.max(0, trim.initialEnd - trim.initialStart);
        dasharray = Math.max(0.0001, (span / 100) * pathLength);
        dashoffset = pathLength * (1 - trim.initialEnd / 100) - (trim.initialOffset / 360) * pathLength;

        animItems.push(`{"id":"${id}","length":${pathLength},"start":${trim.initialStart},"end":${trim.initialEnd},"offset":${trim.initialOffset},"startKf":${trim.startKeyframes},"endKf":${trim.endKeyframes},"offsetKf":${trim.offsetKeyframes}}`);
      }

      const dashAttrs = currentTrim ? ` stroke-dasharray="${dasharray}" stroke-dashoffset="${dashoffset}"` : '';
      lines.push(`<path id="${id}" d="${d}" fill="none" stroke="black" stroke-width="2"${dashAttrs} />`);
    }

    lines.push(`</g>`);
  }

  lines.push(`<script><![CDATA[${buildEmbeddedAnimatorScript(`[${animItems.join(',')}]`, doc.fr, doc.ip, doc.op)}]]></script>`);
  lines.push(`</svg>`);

  return lines.join('');
}
