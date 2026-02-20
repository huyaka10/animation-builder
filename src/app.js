(() => {
  const { useEffect, useMemo, useState, useRef } = React;
  const h = React.createElement;
  const STORAGE_KEY = 'site_versions';


  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const getStartOfDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const formatDisplayDate = (value) => {
    const target = getStartOfDay(value);
    const today = getStartOfDay(new Date());
    const diffDays = Math.round((today - target) / MS_PER_DAY);
    const isCurrentMonth =
      target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (isCurrentMonth && diffDays > 1 && diffDays <= 30) return `${diffDays} days ago`;

    const day = String(target.getDate()).padStart(2, '0');
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const year = String(target.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  };

  const createCurrentMonthDefaults = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    return [
      {
        id: 'default-1',
        title: 'Starter Version 01',
        date: new Date(year, month, Math.max(1, now.getDate() - 1)).toISOString().slice(0, 10),
        image:
          'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80'
      },
      {
        id: 'default-2',
        title: 'Starter Version 02',
        date: new Date(year, month, Math.max(1, now.getDate())).toISOString().slice(0, 10),
        image:
          'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1600&q=80'
      },
      {
        id: 'default-3',
        title: 'Starter Version 03',
        date: new Date(year, month, Math.max(1, now.getDate() - 2)).toISOString().slice(0, 10),
        image:
          'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1600&q=80'
      },
      {
        id: 'default-4',
        title: 'Starter Version 04',
        date: new Date(year, month, Math.max(1, now.getDate() - 3)).toISOString().slice(0, 10),
        image:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80'
      },
      {
        id: 'default-5',
        title: 'Starter Version 05',
        date: new Date(year, month, Math.max(1, now.getDate() - 4)).toISOString().slice(0, 10),
        image:
          'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1600&q=80'
      }
    ];
  };

  const DEFAULT_VERSIONS = createCurrentMonthDefaults();


  const getLatestVersionId = (items) =>
    [...items]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .at(-1)?.id ?? null;


  function VersionStage({ versions, activeVersion, activeIndex }) {
    if (!activeVersion) {
      return h(
        'section',
        { className: 'stage', 'aria-label': 'Version preview stage' },
        h('div', { className: 'stack-frame' }, h('article', { className: 'preview-card is-active' }))
      );
    }

    const previousStart = Math.max(0, activeIndex - 5);
    const previousVersions = versions
      .map((version, versionIndex) => ({ version, versionIndex }))
      .slice(previousStart, activeIndex);

    return h(
      'section',
      { className: 'stage', 'aria-label': 'Version preview stage' },
      h(
        'div',
        { className: 'stack-frame' },
        ...previousVersions.map(({ version, versionIndex }) => {
          const offset = activeIndex - versionIndex;
          return h(
            'article',
            {
              key: version.id,
              className: 'preview-card is-stacked',
              style: {
                transform: `translateY(${-offset * 80}px) translateZ(${-offset * 120}px) scale(${1 - offset * 0.05})`,
                opacity: 1,
                zIndex: versionIndex + 1
              },
              'aria-hidden': 'true'
            },
            h('img', { src: version.image, alt: '' })
          );
        }),
        h(
          'article',
          {
            className: 'preview-card is-active',
            key: activeVersion.id,
            style: {
              transform: 'translateZ(0) scale(1)',
              opacity: 1
            }
          },
          h('img', { src: activeVersion.image, alt: `${activeVersion.title} screenshot` })
        )
      )
    );
  }

  function Timeline({ versions, activeId, onSelect }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const listRef = useRef(null);

    useEffect(() => {
      const list = listRef.current;
      if (!list) return;
      list.scrollTop = list.scrollHeight;
    }, [versions.length]);

    const stabilizeHoverPosition = (element, index) => {
      const list = listRef.current;
      if (!list || !element) {
        setHoveredIndex(index);
        return;
      }

      const beforeTop = element.getBoundingClientRect().top;
      const beforeScroll = list.scrollTop;
      setHoveredIndex(index);

      requestAnimationFrame(() => {
        const afterTop = element.getBoundingClientRect().top;
        const delta = afterTop - beforeTop;

        if (delta > 0) {
          list.scrollTop = Math.min(list.scrollHeight - list.clientHeight, beforeScroll + delta);
        }
      });
    };

    const getWaveStrength = (index) => {
      if (hoveredIndex === null) return 0;
      const distance = Math.abs(hoveredIndex - index);
      if (distance === 0) return 1;
      if (distance === 1) return 0.72;
      if (distance === 2) return 0.52;
      if (distance === 3) return 0.34;
      if (distance === 4) return 0.2;
      if (distance === 5) return 0.1;
      return 0;
    };

    const timelineItems = [];
    let previousMonthKey = null;
    versions.forEach((version, index) => {
      const currentDate = new Date(version.date);
      const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

      if (previousMonthKey !== null && monthKey !== previousMonthKey) {
        const monthLabel = currentDate.toLocaleString('en-US', { month: 'long' });
        timelineItems.push({
          type: 'separator',
          key: `month-${currentDate.getFullYear()}-${currentDate.getMonth()}-${index}`,
          label: monthLabel
        });
      }

      previousMonthKey = monthKey;
      timelineItems.push({ type: 'version', key: version.id, version, index });
    });

    return h(
      'aside',
      { className: 'timeline', 'aria-label': 'Version timeline' },
      h(
        'div',
        {
          ref: listRef,
          className: `timeline-list ${hoveredIndex !== null ? 'is-interacting' : ''}`,
          role: 'list',
          onMouseLeave: () => setHoveredIndex(null)
        },
        ...timelineItems.map((item) => {
          if (item.type === 'separator') {
            return h(
              'div',
              { key: item.key, className: 'timeline-separator', role: 'presentation', 'aria-hidden': 'true' },
              h('span', { className: 'timeline-separator-label' }, item.label),
              h('span', { className: 'timeline-separator-line' })
            );
          }

          const version = item.version;
          const isActive = version.id === activeId;
          const waveStrength = getWaveStrength(item.index);

          return h(
            'button',
            {
              key: item.key,
              className: `timeline-segment ${isActive ? 'is-active' : ''}`,
              role: 'listitem',
              'aria-label': `${version.title} - ${formatDisplayDate(version.date)}`,
              onClick: () => onSelect(version.id),
              onMouseEnter: (event) => stabilizeHoverPosition(event.currentTarget, item.index),
              onFocus: (event) => stabilizeHoverPosition(event.currentTarget, item.index),
              onBlur: () => setHoveredIndex(null),
              style: {
                '--wave-strength': waveStrength
              }
            },
            h(
              'span',
              { className: 'timeline-segment-label' },
              h('strong', { className: 'timeline-segment-title' }, version.title),
              h('small', { className: 'timeline-segment-date' }, formatDisplayDate(version.date))
            ),
            h('span', { className: 'timeline-segment-line' })
          );
        })
      )
    );
  }


  function ControlPanel({ pendingDate, onDateChange, onUpload, activeVersion, onRename, onDelete, canDelete }) {
    const fileRef = useRef(null);
    const [title, setTitle] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const submitUpload = (event) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      onUpload({ files, title });
      event.target.value = '';
      setTitle('');
    };

    return h(
      'div',
      { className: `bottom-panel ${isOpen ? 'is-open' : ''}`, 'aria-label': 'Version controls' },
      h(
        'div',
        {
          className: 'panel-handle',
          role: 'button',
          tabIndex: 0,
          onClick: () => setIsOpen((current) => !current),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setIsOpen((current) => !current);
            }
          },
          'aria-expanded': isOpen,
          'aria-label': 'Toggle settings panel'
        },
        h('span', { className: 'panel-grip', 'aria-hidden': 'true' })
      ),
      h(
        'div',
        { className: 'panel-content' },
        h(
          'section',
          { className: 'controls' },
          h(
            'div',
            { className: 'control-group' },
            h('label', { htmlFor: 'title' }, 'Rename / New Title'),
            h('input', {
              id: 'title',
              value: title,
              onChange: (event) => setTitle(event.target.value),
              placeholder: 'e.g. Pricing revamp'
            })
          ),
          h(
            'div',
            { className: 'control-group' },
            h('label', { htmlFor: 'date' }, 'Set Date'),
            h('input', {
              id: 'date',
              type: 'date',
              value: pendingDate,
              onChange: (event) => onDateChange(event.target.value)
            })
          ),
          h(
            'div',
            { className: 'button-row' },
            h('input', { ref: fileRef, type: 'file', accept: 'image/*', multiple: true, hidden: true, onChange: submitUpload }),
            h('button', { onClick: () => fileRef.current?.click() }, 'Upload Version'),
            h(
              'button',
              { onClick: () => onRename(activeVersion?.id, title), disabled: !title.trim() || !activeVersion },
              'Rename Version'
            ),
            h(
              'button',
              { onClick: () => onDelete(activeVersion?.id), disabled: !canDelete || !activeVersion, className: 'danger' },
              'Delete Version'
            )
          )
        )
      )
    );
  }


  function App() {
    const [versions, setVersions] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [pendingDate, setPendingDate] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
      const setFromDefaults = () => {
        setVersions(DEFAULT_VERSIONS);
        setActiveId(getLatestVersionId(DEFAULT_VERSIONS));
      };

      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setFromDefaults();
        return;
      }

      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVersions(parsed);
          setActiveId(getLatestVersionId(parsed));
        } else {
          setFromDefaults();
        }
      } catch (error) {
        setFromDefaults();
      }
    }, []);

    useEffect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
    }, [versions]);

    const sortedVersions = useMemo(
      () => [...versions].sort((a, b) => new Date(a.date) - new Date(b.date)),
      [versions]
    );

    const activeIndex = sortedVersions.findIndex((version) => version.id === activeId);
    const activeVersion = sortedVersions[activeIndex] ?? sortedVersions[sortedVersions.length - 1];

    useEffect(() => {
      if (sortedVersions.length === 0) {
        if (activeId !== null) setActiveId(null);
        return;
      }

      const exists = sortedVersions.some((version) => version.id === activeId);
      if (!exists) {
        setActiveId(sortedVersions[sortedVersions.length - 1].id);
      }
    }, [sortedVersions, activeId]);

    useEffect(() => {
      const onKeyDown = (event) => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        const tag = event.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) return;
        if (sortedVersions.length === 0) return;

        event.preventDefault();
        const currentIndex = sortedVersions.findIndex((version) => version.id === activeVersion?.id);
        const safeIndex = currentIndex >= 0 ? currentIndex : sortedVersions.length - 1;
        const nextIndex = event.key === 'ArrowUp' ? Math.max(0, safeIndex - 1) : Math.min(sortedVersions.length - 1, safeIndex + 1);
        setActiveId(sortedVersions[nextIndex].id);
      };

      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [sortedVersions, activeVersion?.id]);

    const handleUpload = ({ files, title }) => {
      const nextVersions = files.map((file) => ({
        id: crypto.randomUUID(),
        title: title?.trim() || file.name.replace(/\.[^.]+$/, ''),
        date: pendingDate,
        image: URL.createObjectURL(file)
      }));
      setVersions((current) => [...current, ...nextVersions]);
      setActiveId(nextVersions[nextVersions.length - 1].id);
    };

    const handleRename = (id, title) => {
      if (!id) return;
      setVersions((current) =>
        current.map((version) => (version.id === id ? { ...version, title: title.trim() || version.title } : version))
      );
    };

    const handleDelete = (id) => {
      if (!id) return;
      setVersions((current) => {
        const filtered = current.filter((version) => version.id !== id);
        if (filtered.length === 0) return current;
        if (activeId === id) {
          const fallback = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date)).at(-1);
          setActiveId(fallback.id);
        }
        return filtered;
      });
    };

    return h(
      'div',
      { className: 'app-shell' },
      h(
        'main',
        { className: 'workspace' },
        h(VersionStage, { versions: sortedVersions, activeVersion, activeIndex }),
        h(ControlPanel, {
          pendingDate,
          onDateChange: setPendingDate,
          onUpload: handleUpload,
          activeVersion,
          onRename: handleRename,
          onDelete: handleDelete,
          canDelete: sortedVersions.length > 1
        })
      ),
      h(Timeline, { versions: sortedVersions, activeId: activeVersion?.id, onSelect: setActiveId })
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
