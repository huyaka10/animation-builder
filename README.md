# Lottie JSON → SVG (Browser App)

Веб-приложение для конвертации Lottie JSON в self-contained SVG.

## Что делает

- Работает полностью в браузере.
- Загружает `.json` через `<input type="file">`.
- Конвертирует через `convertLottieToSvg(lottieJson)`.
- Показывает анимированный SVG в preview.
- Даёт скачать готовый SVG (внутри SVG есть `<script>` с `requestAnimationFrame`).

## Архитектура (сохранена)

- `src/parser` — разбор Lottie JSON.
- `src/converters` — shape/transform/trim преобразования.
- `src/generators` — сборка SVG и JS-аниматора.

## Запуск

```bash
npm run dev
```

## Публичная функция

```ts
convertLottieToSvg(lottieJson: string): string
```
