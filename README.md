# lottie2svg (MVP)

Browser-first конвертер Lottie JSON (Bodymovin) в self-contained animated SVG.

## Что поддерживает MVP

- Shape layer pipeline: `shape`, `group`, `path`, `rectangle`, `ellipse` (через path), `trim paths`, `transform`, `opacity`.
- Анимация trim paths через `stroke-dasharray` + `stroke-dashoffset`.
- Режимы анимации: `smil` (по умолчанию) и `css`.
- Неподдерживаемые возможности не ломают выполнение: выводятся warning-сообщения.

## Архитектура (сохранена)

- `src/parser` — парсинг/валидация Lottie.
- `src/converters` — shape/transform/trim преобразования.
- `src/generators` — SVG + SMIL/CSS аниматоры.
- `src/index.ts` — публичный API `convertLottieToSvg()`.

## API

```ts
import { convertLottieToSvg } from './src/index';

const svg = convertLottieToSvg(lottieJsonStringOrObject, {
  mode: 'smil',
  pretty: true,
  optimize: false,
});
```

## Browser UI (без сервера рантайма)

Добавлен `index.html`:
- file input для Lottie JSON,
- кнопка Convert,
- вывод готового SVG (markup + preview).

После сборки Vite создаёт статические файлы (`dist/`), которые можно открыть как обычные файлы.

## Команды

```bash
npm run dev
npm run build
npm run preview
npm run check
npm run test
```
