export function renderTimeline(state, elements) {
  const { timelineList } = elements;
  timelineList.innerHTML = '';

  state.animation.frames.forEach((frame, index) => {
    const item = document.createElement('li');
    item.className = 'timeline-item';
    if (index === state.activeFrameIndex) {
      item.classList.add('active');
    }
    item.draggable = true;
    item.dataset.index = String(index);

    const preview = document.createElement('div');
    preview.className = 'timeline-preview';
    preview.textContent = frame.flat().join('');

    const label = document.createElement('div');
    label.className = 'timeline-label';
    label.textContent = `F${index + 1}`;

    item.append(preview, label);
    timelineList.appendChild(item);
  });
}
