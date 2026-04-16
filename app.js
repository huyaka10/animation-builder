const metrics = [
  {
    id: 'revenue',
    name: 'Доходы',
    level: 0,
    group: true,
    values: ['', '', '', ''],
    children: [
      { id: 'purchases', name: 'Количество покупок', level: 1, values: ['1 667,45', '1 489,45|-0,95%', '1 489,45|-0,95%', '1 489,45|-0,95%'] },
      {
        id: 'gross-revenue',
        name: 'Revenue',
        level: 1,
        values: ['544 489,45', '537 381,14|-0,95%', '537 381,14|-0,95%', '537 381,14|-0,95%'],
        children: [
          {
            id: 'platform',
            name: 'Платформа приложения',
            level: 2,
            values: ['', '', '', ''],
            children: [
              { id: 'ios', name: 'iOS', level: 3, values: ['343 385,13', '337 141,10|-0,29%', '394 735,94|+1,04%', '337 141,10|-0,29%'] },
              { id: 'android', name: 'Android', level: 3, values: ['204 104,32', '200 240,04|0,51%', '194 645,06|-0,83%', '200 240,04|-0,29%'] },
              { id: 'web', name: 'Web', level: 3, values: ['34 110,98', '39 423,12|+0,61%', '30 990,00|-0,34%', '35 012,23|+0,18%'] },
            ],
          },
          {
            id: 'region',
            name: 'Регион',
            level: 2,
            values: ['', '', '', ''],
            children: [
              { id: 'ru', name: 'Россия', level: 3, values: ['129 330,98', '132 124,44|+0,31%', '127 901,90|-0,25%', '130 883,21|+0,13%'] },
              { id: 'eu', name: 'Европа', level: 3, values: ['121 777,17', '118 223,22|-0,44%', '121 000,95|-0,06%', '122 343,43|+0,08%'] },
              { id: 'latam', name: 'Латинская Америка', level: 3, values: ['88 883,88', '91 133,01|+0,52%', '89 009,45|+0,03%', '90 120,44|+0,29%'] },
            ],
          },
          {
            id: 'subscription',
            name: 'Подписка',
            level: 2,
            values: ['', '', '', ''],
            children: [
              { id: 'trial', name: 'Триал', level: 3, values: ['44 220,00', '42 902,00|-0,40%', '45 001,12|+0,22%', '44 980,12|+0,19%'] },
              { id: 'monthly', name: 'Месячная', level: 3, values: ['140 004,00', '138 000,00|-0,28%', '141 701,55|+0,20%', '139 920,22|-0,03%'] },
              { id: 'annual', name: 'Годовая', level: 3, values: ['221 992,00', '220 115,45|-0,10%', '225 881,45|+0,29%', '222 002,21|+0,01%'] },
            ],
          },
        ],
      },
      { id: 'average-check', name: 'Средний чек', level: 1, values: ['3 048,00', '5 489,45|+1,94%', '5 489,45|+1,94%', '1 489,45|+1,94%'] },
      { id: 'conversion', name: 'Конверсия', level: 1, group: true, values: ['2,41%', '2,37%|-0,04%', '2,46%|+0,05%', '2,39%|-0,02%'] },
    ],
  },
];

const sliceMetrics = ['Количество покупок', 'Revenue', 'Средний чек', 'Конверсия', 'ARPU', 'ARPPU', 'LTV D30', 'Retention D7', 'Retention D30', 'ROI', 'CAC'];

const slices = [
  {
    id: 'slice-region',
    name: 'Регион',
    level: 0,
    values: {
      'Количество покупок': { value: '1 489,45', delta: '-0,95%' },
      Revenue: { value: '537 381,14', delta: '-0,95%' },
      'Средний чек': { value: '5 489,45', delta: '-0,95%' },
      'Конверсия': { value: '2,37%', delta: '-0,95%' },
    },
    children: [
      { id: 'slice-ru', name: 'Россия', level: 1, values: { 'Количество покупок': { value: '441,20', delta: '+0,23%' }, Revenue: { value: '132 124,44', delta: '+0,31%' }, 'Средний чек': { value: '4 910,33', delta: '+0,72%' }, 'Конверсия': { value: '2,91%', delta: '+0,14%' } } },
      { id: 'slice-eu', name: 'Европа', level: 1, values: { 'Количество покупок': { value: '395,31', delta: '-0,16%' }, Revenue: { value: '118 223,22', delta: '-0,44%' }, 'Средний чек': { value: '5 221,49', delta: '-0,27%' }, 'Конверсия': { value: '2,20%', delta: '-0,08%' } } },
      { id: 'slice-na', name: 'Северная Америка', level: 1, values: { 'Количество покупок': { value: '358,12', delta: '+0,09%' }, Revenue: { value: '139 992,02', delta: '+0,11%' }, 'Средний чек': { value: '6 008,29', delta: '+0,48%' }, 'Конверсия': { value: '2,41%', delta: '+0,06%' } } },
      { id: 'slice-latam', name: 'Латинская Америка', level: 1, values: { 'Количество покупок': { value: '294,82', delta: '+0,52%' }, Revenue: { value: '91 133,01', delta: '+0,52%' }, 'Средний чек': { value: '4 334,29', delta: '+0,32%' }, 'Конверсия': { value: '1,97%', delta: '+0,04%' } } },
    ],
  },
  {
    id: 'slice-platform',
    name: 'Платформа приложения',
    level: 0,
    values: {
      'Количество покупок': { value: '1 489,45', delta: '-1,94%' },
      Revenue: { value: '537 381,14', delta: '-1,94%' },
      'Средний чек': { value: '5 489,45', delta: '+1,94%' },
      'Конверсия': { value: '2,37%', delta: '+1,94%' },
    },
    children: [
      { id: 'slice-ios', name: 'iOS', level: 1, values: { 'Количество покупок': { value: '337 141,10', delta: '-0,29%' }, Revenue: { value: '337 141,10', delta: '-0,29%' }, 'Средний чек': { value: '5 841,10', delta: '+1,04%' }, 'Конверсия': { value: '2,62%', delta: '-0,29%' } } },
      { id: 'slice-android', name: 'Android', level: 1, values: { 'Количество покупок': { value: '200 240,04', delta: '-0,29%' }, Revenue: { value: '200 240,04', delta: '-0,29%' }, 'Средний чек': { value: '4 981,72', delta: '+1,04%' }, 'Конверсия': { value: '2,11%', delta: '-0,29%' } } },
      { id: 'slice-web', name: 'Web', level: 1, values: { 'Количество покупок': { value: '39 423,12', delta: '+0,61%' }, Revenue: { value: '39 423,12', delta: '+0,61%' }, 'Средний чек': { value: '3 899,20', delta: '+0,17%' }, 'Конверсия': { value: '1,78%', delta: '+0,03%' } } },
    ],
  },
  {
    id: 'slice-subscription',
    name: 'Подписка',
    level: 0,
    values: {
      'Количество покупок': { value: '1 489,45', delta: '-1,94%' },
      Revenue: { value: '537 381,14', delta: '-1,94%' },
      'Средний чек': { value: '5 489,45', delta: '+1,94%' },
      'Конверсия': { value: '2,37%', delta: '+1,94%' },
    },
    children: [
      { id: 'slice-trial', name: 'Триал', level: 1, values: { 'Количество покупок': { value: '42 902,00', delta: '-0,40%' }, Revenue: { value: '42 902,00', delta: '-0,40%' }, 'Средний чек': { value: '1 942,12', delta: '+0,22%' }, 'Конверсия': { value: '0,88%', delta: '+0,04%' } } },
      { id: 'slice-monthly', name: 'Месячная', level: 1, values: { 'Количество покупок': { value: '138 000,00', delta: '-0,28%' }, Revenue: { value: '138 000,00', delta: '-0,28%' }, 'Средний чек': { value: '2 880,22', delta: '+0,20%' }, 'Конверсия': { value: '1,20%', delta: '-0,03%' } } },
      { id: 'slice-annual', name: 'Годовая', level: 1, values: { 'Количество покупок': { value: '220 115,45', delta: '-0,10%' }, Revenue: { value: '220 115,45', delta: '-0,10%' }, 'Средний чек': { value: '9 102,00', delta: '+0,29%' }, 'Конверсия': { value: '0,51%', delta: '+0,01%' } } },
    ],
  },
  {
    id: 'slice-channel',
    name: 'Канал привлечения',
    level: 0,
    values: {
      'Количество покупок': { value: '1 489,45', delta: '-0,44%' },
      Revenue: { value: '537 381,14', delta: '+0,05%' },
      'Средний чек': { value: '5 489,45', delta: '+0,36%' },
      'Конверсия': { value: '2,37%', delta: '+0,08%' },
    },
    children: [
      { id: 'slice-organic', name: 'Organic', level: 1, values: { 'Количество покупок': { value: '510,00', delta: '+0,14%' }, Revenue: { value: '180 022,12', delta: '+0,22%' }, 'Средний чек': { value: '5 302,10', delta: '+0,09%' }, 'Конверсия': { value: '2,80%', delta: '+0,04%' } } },
      { id: 'slice-ads', name: 'Paid Ads', level: 1, values: { 'Количество покупок': { value: '689,12', delta: '-0,31%' }, Revenue: { value: '248 552,04', delta: '-0,10%' }, 'Средний чек': { value: '5 460,14', delta: '+0,41%' }, 'Конверсия': { value: '2,12%', delta: '-0,02%' } } },
      { id: 'slice-ref', name: 'Referral', level: 1, values: { 'Количество покупок': { value: '290,33', delta: '+0,08%' }, Revenue: { value: '108 807,98', delta: '+0,11%' }, 'Средний чек': { value: '5 892,20', delta: '+0,31%' }, 'Конверсия': { value: '2,01%', delta: '+0,06%' } } },
    ],
  },
];

const expandedHierarchy = new Set([...metrics.map((m) => m.id), 'gross-revenue', 'platform']);
const expandedSlices = new Set(slices.map((s) => s.id));

const tbody = document.getElementById('metricsTableBody');
const headRow = document.getElementById('tableHeadRow');
const searchInput = document.getElementById('searchInput');
const viewHierarchyBtn = document.getElementById('viewHierarchy');
const viewSlicesBtn = document.getElementById('viewSlices');
const tableCard = document.getElementById('tableCard');

let viewMode = 'hierarchy';

function flatten(nodes, parentId = null) {
  return nodes.flatMap((node) => {
    const row = { ...node, parentId };
    const children = node.children ? flatten(node.children, node.id) : [];
    return [row, ...children];
  });
}

const hierarchyRows = flatten(metrics);
const sliceRows = flatten(slices);

function splitValue(value) {
  const [primary = '', delta = ''] = (value || '').split('|');
  return { primary, delta };
}

function deltaClass(delta) {
  if (!delta) return '';
  if (delta.includes('-')) return 'negative';
  if (delta.includes('+')) return 'positive';
  return '';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text, query) {
  if (!query) return text;
  const pattern = new RegExp(`(${escapeRegExp(query)})`, 'ig');
  return text.replace(pattern, '<span class="text-match">$1</span>');
}

function setTabState(active, inactive) {
  active.classList.add('active');
  active.setAttribute('aria-selected', 'true');
  inactive.classList.remove('active');
  inactive.setAttribute('aria-selected', 'false');
}

function renderHeaders(labels) {
  headRow.innerHTML = '';
  labels.forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  });
}

function hasVisibleChild(rows, rowId, query) {
  return rows.some((row) => {
    if (row.parentId !== rowId) return false;
    if (!query || row.name.toLowerCase().includes(query.toLowerCase())) return true;
    return hasVisibleChild(rows, row.id, query);
  });
}

function isVisible(rows, expandedSet, row, query) {
  if (query && !(row.name.toLowerCase().includes(query.toLowerCase()) || hasVisibleChild(rows, row.id, query))) return false;
  let currentParent = row.parentId;
  while (currentParent) {
    if (!expandedSet.has(currentParent)) return false;
    const parent = rows.find((item) => item.id === currentParent);
    currentParent = parent?.parentId;
  }
  return true;
}

function createNameCell(row, query, expandedSet, onToggle) {
  const td = document.createElement('td');
  const wrapper = document.createElement('div');
  wrapper.className = 'metric-cell';

  if (row.children?.length) {
    const toggle = document.createElement('button');
    const isExpanded = expandedSet.has(row.id);
    toggle.className = 'toggle';
    toggle.innerHTML = `<span class="toggle__chevron" aria-hidden="true">${isExpanded ? '⌃' : '⌄'}</span>`;
    toggle.setAttribute('aria-label', isExpanded ? `Свернуть ${row.name}` : `Раскрыть ${row.name}`);
    toggle.addEventListener('click', onToggle);
    wrapper.appendChild(toggle);
  } else {
    const spacer = document.createElement('span');
    spacer.style.display = 'inline-block';
    spacer.style.width = '26px';
    wrapper.appendChild(spacer);
  }

  const title = document.createElement('span');
  title.innerHTML = highlightMatch(row.name, query);
  wrapper.appendChild(title);
  td.appendChild(wrapper);
  return td;
}

function renderHierarchy(query = '') {
  renderHeaders(['Метрики и срезы', 'Контрольная группа', 'Тестовая группа 1', 'Тестовая группа 2', 'Тестовая группа 3']);
  tbody.innerHTML = '';

  hierarchyRows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.classList.add(`level-${row.level}`);
    if (row.group) tr.classList.add('group');
    if (!isVisible(hierarchyRows, expandedHierarchy, row, query)) tr.classList.add('hidden-row');
    if (query && row.name.toLowerCase().includes(query.toLowerCase())) tr.classList.add('match');

    tr.appendChild(
      createNameCell(row, query, expandedHierarchy, () => {
        if (expandedHierarchy.has(row.id)) expandedHierarchy.delete(row.id);
        else expandedHierarchy.add(row.id);
        render();
      }),
    );

    row.values.forEach((raw) => {
      const td = document.createElement('td');
      const { primary, delta } = splitValue(raw);
      td.textContent = primary;
      if (delta) {
        const d = document.createElement('span');
        d.className = `delta ${deltaClass(delta)}`;
        d.textContent = ` ${delta}`;
        td.appendChild(d);
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}


function fallbackCell(rowId, metricName) {
  const seed = `${rowId}-${metricName}`.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const sign = seed % 2 === 0 ? '+' : '-';
  const deltaNum = ((seed % 230) / 100).toFixed(2).replace('.', ',');
  const delta = `${sign}${deltaNum}%`;
  const value = `${(200 + (seed % 900)).toLocaleString('ru-RU')},${String(seed % 99).padStart(2, '0')}`;
  return { value, delta };
}

function renderSlicesMatrix(query = '') {
  renderHeaders(['Срезы', ...sliceMetrics]);
  tbody.innerHTML = '';

  sliceRows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.classList.add(`level-${row.level}`);
    if (!isVisible(sliceRows, expandedSlices, row, query)) tr.classList.add('hidden-row');
    if (query && row.name.toLowerCase().includes(query.toLowerCase())) tr.classList.add('match');

    tr.appendChild(
      createNameCell(row, query, expandedSlices, () => {
        if (expandedSlices.has(row.id)) expandedSlices.delete(row.id);
        else expandedSlices.add(row.id);
        render();
      }),
    );

    sliceMetrics.forEach((metricName) => {
      const cell = row.values?.[metricName] || fallbackCell(row.id, metricName);
      const td = document.createElement('td');
      const text = cell.delta;
      td.textContent = text;
      td.classList.add(deltaClass(text));
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

function render() {
  const query = searchInput.value.trim();
  if (viewMode === 'hierarchy') {
    tableCard.classList.remove('is-slices');
    renderHierarchy(query);
  } else {
    tableCard.classList.add('is-slices');
    renderSlicesMatrix(query);
  }
}

viewHierarchyBtn.addEventListener('click', () => {
  viewMode = 'hierarchy';
  setTabState(viewHierarchyBtn, viewSlicesBtn);
  render();
});

viewSlicesBtn.addEventListener('click', () => {
  viewMode = 'slices';
  setTabState(viewSlicesBtn, viewHierarchyBtn);
  render();
});

searchInput.addEventListener('input', render);


let isDragging = false;
let dragStartX = 0;
let initialScrollLeft = 0;

tableCard.addEventListener('mousedown', (event) => {
  isDragging = true;
  tableCard.classList.add('dragging');
  dragStartX = event.pageX;
  initialScrollLeft = tableCard.scrollLeft;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  tableCard.classList.remove('dragging');
});

window.addEventListener('mousemove', (event) => {
  if (!isDragging) return;
  const distance = event.pageX - dragStartX;
  tableCard.scrollLeft = initialScrollLeft - distance;
});

render();
