(() => {
  const { useMemo, useState, useRef } = React;
  const h = React.createElement;

  const seedVersions = [
    {
      id: crypto.randomUUID(),
      title: 'Homepage v1',
      date: '2024-10-05',
      image:
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80'
    },
    {
      id: crypto.randomUUID(),
      title: 'Homepage v2',
      date: '2024-12-18',
      image:
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1600&q=80'
    },
    {
      id: crypto.randomUUID(),
      title: 'Landing refresh',
      date: '2025-02-22',
      image:
        'https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=1600&q=80'
    }
  ];

  function VersionStage({ versions, activeVersion, activeIndex }) {
    const previous = versions.slice(Math.max(0, activeIndex - 5), activeIndex);

    return h(
      'section',
      { className: 'stage', 'aria-label': 'Version preview stage' },
      h(
        'div',
        { className: 'stack-frame' },
        ...previous.map((version, index) => {
          const depth = previous.length - index;
          return h(
            'article',
            {
              key: version.id,
              className: 'preview-card is-stacked',
              style: {
                transform: `translateY(${-16 * depth}px) scale(${1 - depth * 0.05})`,
                opacity: Math.max(0.14, 0.8 - depth * 0.14),
                filter: `blur(${Math.min(3, depth * 0.7)}px)`,
                zIndex: index + 1
              },
              'aria-hidden': 'true'
            },
            h('img', { src: version.image, alt: '' })
          );
        }),
        h(
          'article',
          { className: 'preview-card is-active', key: activeVersion.id },
          h('img', { src: activeVersion.image, alt: `${activeVersion.title} screenshot` }),
          h(
            'div',
            { className: 'preview-meta' },
            h('h2', null, activeVersion.title),
            h('p', null, new Date(activeVersion.date).toLocaleDateString())
          )
        )
      )
    );
  }

  function Timeline({ versions, activeId, onSelect }) {
    return h(
      'aside',
      { className: 'timeline', 'aria-label': 'Version timeline' },
      h('h3', null, 'Timeline'),
      h(
        'div',
        { className: 'timeline-list' },
        ...versions.map((version) => {
          const isActive = version.id === activeId;
          return h(
            'button',
            {
              key: version.id,
              className: `timeline-item ${isActive ? 'is-active' : ''}`,
              onClick: () => onSelect(version.id)
            },
            h('span', { className: 'timeline-date' }, new Date(version.date).toLocaleDateString()),
            h('strong', null, version.title)
          );
        })
      )
    );
  }

  function ControlPanel({ pendingDate, onDateChange, onUpload, activeVersion, onRename, onDelete, canDelete }) {
    const fileRef = useRef(null);
    const [title, setTitle] = useState('');

    const submitUpload = (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      onUpload({ file, title });
      event.target.value = '';
      setTitle('');
    };

    return h(
      'section',
      { className: 'controls', 'aria-label': 'Version controls' },
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
        h('input', { ref: fileRef, type: 'file', accept: 'image/*', hidden: true, onChange: submitUpload }),
        h('button', { onClick: () => fileRef.current?.click() }, 'Upload Version'),
        h('button', { onClick: () => onRename(activeVersion.id, title), disabled: !title.trim() }, 'Rename Version'),
        h(
          'button',
          { onClick: () => onDelete(activeVersion.id), disabled: !canDelete, className: 'danger' },
          'Delete Version'
        )
      )
    );
  }

  function App() {
    const [versions, setVersions] = useState(seedVersions);
    const [activeId, setActiveId] = useState(seedVersions[seedVersions.length - 1].id);
    const [pendingDate, setPendingDate] = useState(new Date().toISOString().slice(0, 10));

    const sortedVersions = useMemo(
      () => [...versions].sort((a, b) => new Date(a.date) - new Date(b.date)),
      [versions]
    );

    const activeIndex = sortedVersions.findIndex((version) => version.id === activeId);
    const activeVersion = sortedVersions[activeIndex] ?? sortedVersions[sortedVersions.length - 1];

    const handleUpload = ({ file, title }) => {
      const nextVersion = {
        id: crypto.randomUUID(),
        title: title?.trim() || file.name.replace(/\.[^.]+$/, ''),
        date: pendingDate,
        image: URL.createObjectURL(file)
      };
      setVersions((current) => [...current, nextVersion]);
      setActiveId(nextVersion.id);
    };

    const handleRename = (id, title) => {
      setVersions((current) =>
        current.map((version) => (version.id === id ? { ...version, title: title.trim() || version.title } : version))
      );
    };

    const handleDelete = (id) => {
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
      h(Timeline, { versions: sortedVersions, activeId: activeVersion.id, onSelect: setActiveId })
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
