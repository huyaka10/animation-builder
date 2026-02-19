(() => {
  const { useEffect, useMemo, useState, useRef } = React;
  const h = React.createElement;
  const STORAGE_KEY = 'site_versions';

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
          const indexOffset = activeIndex - versionIndex;
          return h(
            'article',
            {
              key: version.id,
              className: 'preview-card is-stacked',
              style: {
                transform: `translateZ(${-indexOffset * 140}px) translateY(${-indexOffset * 42}px) scale(${1 - indexOffset * 0.05})`,
                opacity: Math.max(0, 1 - indexOffset * 0.15),
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
      h(
        'div',
        { className: 'timeline-list', role: 'list' },
        ...versions.map((version) => {
          const isActive = version.id === activeId;
          return h(
            'button',
            {
              key: version.id,
              className: `timeline-segment ${isActive ? 'is-active' : ''}`,
              role: 'listitem',
              'aria-label': `${version.title} - ${new Date(version.date).toLocaleDateString()}`,
              onClick: () => onSelect(version.id)
            },
            h('span', { className: 'timeline-segment-line' }),
            h('span', { className: 'timeline-segment-label' }, new Date(version.date).toLocaleDateString())
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
    );
  }

  function App() {
    const [versions, setVersions] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [pendingDate, setPendingDate] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setVersions([]);
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
          setVersions([]);
        }
      } catch (error) {
        setVersions([]);
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
