import { buildTrimPresentation } from '../converters/trim.js';
import { extractPath, lottiePathToSvgD } from '../converters/shape.js';
import { buildTransform } from '../converters/transform.js';
import { LottieDocument, LottieLayer, LottieShapeItem, LottieTrimItem, WarningCollector } from '../types/lottie.js';
import { estimatePathLength } from '../utils/path-length.js';

interface BuildOptions {
  mode: 'smil' | 'css';
  pretty?: boolean;
  optimize?: boolean;
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
  const cssKeyframes: string[] = [];
  const indent = options.pretty ? '  ' : '';
  const nl = options.pretty ? '\n' : '';

  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${doc.w} ${doc.h}" width="${doc.w}" height="${doc.h}">`);

  for (const [layerIndex, layer] of doc.layers.entries()) {
    unsupportedLayerWarnings(layer, options.warnings);
    if (layer.ty !== 4 || !layer.shapes) continue;

    const transform = buildTransform(layer.ks, doc.fr, options.mode, `opacity_${layerIndex}`);
    const layerBody: string[] = [];
    const currentTrim = layer.shapes.find((item) => item.ty === 'tm' && 'e' in item && 's' in item && 'o' in item) as LottieTrimItem | undefined;

    for (const item of layer.shapes) {
      shapeWarnings(item, options.warnings);
      if (item.ty === 'tm') continue;

      const path = extractPath(item);
      if (!path) continue;

      const d = lottiePathToSvgD(path);
      const styleParts: string[] = ['fill="none"', 'stroke="black"', 'stroke-width="2"'];
      const childFragments: string[] = [];
      let className = '';

      if (currentTrim) {
        const pathLength = estimatePathLength(path);
        const trim = buildTrimPresentation(currentTrim, pathLength, doc.fr, options.mode, `trim_${layerIndex}`);
        styleParts.push(`stroke-dasharray="${trim.dasharray}"`);
        styleParts.push(`stroke-dashoffset="${trim.dashoffset}"`);
        if (trim.smilAnimation) childFragments.push(trim.smilAnimation);
        if (trim.cssAnimation) {
          cssKeyframes.push(trim.cssAnimation.keyframes);
          className = ` class="trim_${layerIndex}"`;
          cssKeyframes.push(`.trim_${layerIndex} { ${trim.cssAnimation.classRule} }`);
        }
      }

      if (transform.opacitySmil) childFragments.push(transform.opacitySmil);
      if (transform.opacityCss) {
        cssKeyframes.push(transform.opacityCss.keyframes);
        className = ` class="opacity_${layerIndex}${className ? ` ${className.replace(' class="', '').replace('"', '')}` : ''}"`;
        cssKeyframes.push(`.opacity_${layerIndex} { ${transform.opacityCss.classRule} }`);
      }

      layerBody.push(`${indent}<path${className} d="${d}" ${styleParts.join(' ')}>${childFragments.join('')}</path>`);
    }

    lines.push(`${indent}<g transform="${transform.transform}" opacity="${transform.opacity}" transform-origin="${transform.origin}">${nl}${layerBody.join(nl)}${nl}${indent}</g>`);
  }

  if (options.mode === 'css' && cssKeyframes.length) {
    lines.splice(1, 0, `${indent}<style>${cssKeyframes.join(options.pretty ? '\n' : '')}</style>`);
  }

  lines.push('</svg>');
  const svg = lines.join(nl);

  if (options.optimize) {
    return svg.replace(/\s+/g, ' ').replace(/> </g, '><').trim();
  }
  return svg;
}
