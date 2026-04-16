const metrics = [
  {
    id: 'revenue',
    name: 'Доходы',
    level: 0,
    group: true,
    values: ['', '', '', ''],
    children: [
      {
        id: 'purchases',
        name: 'Количество покупок',
        level: 1,
        values: ['1 667,45', '1 489,45|-0,95%', '1 489,45|-0,95%', '1 489,45|-0,95%'],
      },
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
              {
                id: 'ios',
                name: 'iOS',
                level: 3,
                values: ['343 385,13', '337 141,10|-0,29%', '394 735,94|+1,04%', '337 141,10|-0,29%'],
              },
              {
                id: 'android',
                name: 'Android',
                level: 3,
                values: ['204 104,32', '200 240,04|0,51%', '194 645,06|-0,83%', '200 240,04|-0,29%'],
              },
              {
                id: 'web',
                name: 'Web',
                level: 3,
                values: ['34 110,98', '39 423,12|+0,61%', '30 990,00|-0,34%', '35 012,23|+0,18%'],
              },
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
      {
        id: 'average-check',
        name: 'Средний чек',
        level: 1,
        values: ['3 048,00', '5 489,45|+1,94%', '5 489,45|+1,94%', '1 489,45|+1,94%'],
      },
      {
        id: 'conversion',
        name: 'Конверсия',
        level: 1,
        group: true,
        values: ['2,41%', '2,37%|-0,04%', '2,46%|+0,05%', '2,39%|-0,02%'],
      },
    ],
  },
  {
    id: 'engagement',
    name: 'Вовлечение',
    level: 0,
    group: true,
    values: ['', '', '', ''],
    children: [
      { id: 'dau', name: 'DAU', level: 1, values: ['1 242 400', '1 260 222|+1,43%', '1 251 480|+0,73%', '1 245 100|+0,21%'] },
      { id: 'session', name: 'Средняя длина сессии', level: 1, values: ['10:21', '10:44|+3,71%', '10:33|+1,94%', '10:25|+0,65%'] },
      { id: 'retention7', name: 'Retention D7', level: 1, values: ['23,1%', '22,8%|-0,30%', '23,4%|+0,30%', '23,0%|-0,10%'] },
      { id: 'retention30', name: 'Retention D30', level: 1, values: ['14,3%', '14,1%|-0,20%', '14,5%|+0,20%', '14,0%|-0,30%'] },
    ],
  },
  {
    id: 'quality',
    name: 'Качество и стабильность',
    level: 0,
    group: true,
    values: ['', '', '', ''],
    children: [
      { id: 'crash', name: 'Crash-free users', level: 1, values: ['98,72%', '98,61%|-0,11%', '98,85%|+0,13%', '98,76%|+0,04%'] },
      { id: 'anr', name: 'ANR rate', level: 1, values: ['0,24%', '0,26%|+0,02%', '0,20%|-0,04%', '0,22%|-0,02%'] },
      { id: 'load-time', name: 'Время загрузки', level: 1, values: ['2,1 с', '2,3 с|+0,2 с', '1,9 с|-0,2 с', '2,0 с|-0,1 с'] },
    ],
  },
];

const expanded = new Set([...metrics.map((m) => m.id), 'gross-revenue', 'platform']);
const tbody = document.getElementById('metricsTableBody');
const searchInput = document.getElementById('searchInput');

function flatten(nodes, parentId = null) {
  return nodes.flatMap((node) => {
    const row = { ...node, parentId };
    const children = node.children ? flatten(node.children, node.id) : [];
    return [row, ...children];
  });
}

const rows = flatten(metrics);

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

function createMetricCell(row) {
  const cell = document.createElement('td');
  const wrapper = document.createElement('div');
  wrapper.className = 'metric-cell';

  if (row.children?.length) {
    const toggle = document.createElement('button');
    const isExpanded = expanded.has(row.id);
    toggle.className = `toggle ${isExpanded ? 'is-expanded' : ''}`.trim();
    toggle.innerHTML = `<span class="toggle__chevron" aria-hidden="true">${isExpanded ? '⌃' : '⌄'}</span>`;
    toggle.setAttribute('aria-label', isExpanded ? `Свернуть ${row.name}` : `Раскрыть ${row.name}`);
    toggle.addEventListener('click', () => {
      if (expanded.has(row.id)) expanded.delete(row.id);
      else expanded.add(row.id);
      renderRows(searchInput.value);
    });
    wrapper.appendChild(toggle);
  } else {
    const spacer = document.createElement('span');
    spacer.style.display = 'inline-block';
    spacer.style.width = '26px';
    wrapper.appendChild(spacer);
  }

  const title = document.createElement('span');
  title.textContent = row.name;
  wrapper.appendChild(title);

  cell.appendChild(wrapper);
  return cell;
}

function matchesSearch(row, query) {
  if (!query) return true;
  return row.name.toLowerCase().includes(query.toLowerCase());
}

function hasVisibleChild(rowId, query) {
  return rows.some((row) => {
    if (row.parentId !== rowId) return false;
    if (matchesSearch(row, query)) return true;
    return hasVisibleChild(row.id, query);
  });
}

function isVisible(row, query) {
  if (query && !(matchesSearch(row, query) || hasVisibleChild(row.id, query))) {
    return false;
  }

  let currentParent = row.parentId;
  while (currentParent) {
    if (!expanded.has(currentParent)) return false;
    const parent = rows.find((item) => item.id === currentParent);
    currentParent = parent?.parentId;
  }
  return true;
}

function renderRows(query = '') {
  tbody.innerHTML = '';

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.dataset.id = row.id;
    tr.classList.add(`level-${row.level}`);
    if (row.group) tr.classList.add('group');

    if (!isVisible(row, query)) tr.classList.add('hidden-row');
    if (query && matchesSearch(row, query)) tr.classList.add('match');

    tr.appendChild(createMetricCell(row));

    row.values.forEach((raw) => {
      const td = document.createElement('td');
      const { primary, delta } = splitValue(raw);
      td.textContent = primary;

      if (delta) {
        const deltaEl = document.createElement('span');
        deltaEl.textContent = ` ${delta}`;
        deltaEl.className = `delta ${deltaClass(delta)}`;
        td.appendChild(deltaEl);
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

searchInput.addEventListener('input', (event) => {
  renderRows(event.target.value.trim());
});

renderRows();
