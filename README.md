# lottie2svg (MVP)

CLI-утилита на Node.js + TypeScript для конвертации Lottie JSON (Bodymovin) в self-contained SVG.

## Возможности MVP

- Поддержка: shape layer, group, path, rectangle, ellipse (через path), trim paths, transform, opacity.
- Анимация trim paths через `stroke-dasharray` + `stroke-dashoffset`.
- Режимы анимации: `--mode=smil` (по умолчанию) и `--mode=css`.
- Предупреждения для неподдерживаемых фич (без падения).
- Модульная архитектура: `parser/`, `converters/`, `generators/`.

## Использование

```bash
npm install
npm run build
npx lottie2svg input.json output.svg --mode=smil --pretty
```

Флаги:

- `--mode=smil|css`
- `--pretty`
- `--optimize`

## Архитектура

- `src/parser` — изолированный разбор Lottie JSON/объекта.
- `src/converters/shape.ts` — path/rect/ellipse -> SVG path.
- `src/converters/transform.ts` — transform + opacity.
- `src/converters/trim.ts` — trim paths -> dasharray/dashoffset.
- `src/generators/smil-animator.ts` — SMIL анимации.
- `src/generators/css-animator.ts` — CSS keyframes.
- `src/generators/svg-builder.ts` — сборка итогового SVG.

## Пример

```bash
npm run build
node dist/cli.js examples/trim-sample.json out.svg --mode=smil --pretty
```
