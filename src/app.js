(() => {
  const { useEffect, useMemo, useState, useRef } = React;
  const h = React.createElement;
  const STORAGE_KEY = 'site_versions';

  const createPlaceholderImage = (hex) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="none"><rect width="1600" height="900" fill="${hex}" /></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };


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

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 31) return `${diffDays} days ago`;

    const day = String(target.getDate()).padStart(2, '0');
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const year = target.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const DEFAULT_VERSIONS = [
    { id: 'default-1', title: 'Initial Landing', date: '2024-01-12', image: createPlaceholderImage('#f59e0b') },
    { id: 'default-2', title: 'Hero Update', date: '2024-02-08', image: createPlaceholderImage('#f97316') },
    { id: 'default-3', title: 'Pricing Refresh', date: '2024-03-15', image: createPlaceholderImage('#10b981') },
    { id: 'default-4', title: 'Checkout Flow', date: '2024-04-19', image: createPlaceholderImage('#3b82f6') },
    { id: 'default-5', title: 'Summer Promo', date: '2024-05-27', image: createPlaceholderImage('#8b5cf6') }
  ];

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
    const pointerXRef = useRef(0);

    useEffect(() => {
      const handleMove = (event) => {
        pointerXRef.current = event.clientX;
      };

      const handleWheel = (event) => {
        const list = listRef.current;
        if (!list) return;
        const rightThreshold = window.innerWidth * 0.65;
        if (pointerXRef.current < rightThreshold) return;

        const hasScrollableSpace = list.scrollHeight > list.clientHeight;
        if (!hasScrollableSpace) return;

        event.preventDefault();
        list.scrollTop += event.deltaY;
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('wheel', handleWheel);
      };
    }, []);

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

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const timelineItems = [];
    versions.forEach((version, index) => {
      const currentDate = new Date(version.date);
      const previous = versions[index - 1];

      if (previous) {
        const prevDate = new Date(previous.date);
        const isBoundary =
          prevDate.getFullYear() !== currentDate.getFullYear() || prevDate.getMonth() !== currentDate.getMonth();
        const isOlderMonth =
          currentDate.getFullYear() !== currentYear || currentDate.getMonth() !== currentMonth;

        if (isBoundary && isOlderMonth) {
          const monthLabel = currentDate.toLocaleString('en-US', { month: 'long' });
          timelineItems.push({
            type: 'separator',
            key: `month-${currentDate.getFullYear()}-${currentDate.getMonth()}-${index}`,
            label: monthLabel
          });
        }
      }

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
              onMouseEnter: () => setHoveredIndex(item.index),
              onFocus: () => setHoveredIndex(item.index),
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
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setVersions(DEFAULT_VERSIONS);
        setActiveId(DEFAULT_VERSIONS[DEFAULT_VERSIONS.length - 1].id);
        return;
      }

      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setVersions(parsed);
          if (parsed.length > 0) {
            const fallback = [...parsed].sort((a, b) => new Date(a.date) - new Date(b.date)).at(-1);
            setActiveId(fallback.id);
          }
        } else {
          setVersions(DEFAULT_VERSIONS);
          setActiveId(DEFAULT_VERSIONS[DEFAULT_VERSIONS.length - 1].id);
        }
      } catch (error) {
        setVersions(DEFAULT_VERSIONS);
        setActiveId(DEFAULT_VERSIONS[DEFAULT_VERSIONS.length - 1].id);
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
