
import { FC, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CouncilResponse, CouncilMember } from '../types';
import {
  Sparkles, Gavel, GripVertical, Plus, X,
  Share2, Eye, EyeOff, Layers, Copy, Check as CheckIcon,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CanvasItem {
  id: string;        // `${memberId}::${category}`
  memberId: string;
  category: string;
  content: string;
}

interface CompositionStageProps {
  responses: CouncilResponse[];
  members: CouncilMember[];
  onCompose: (composedText: string) => void;
}

// ─── Category style maps (static strings so Tailwind JIT picks them up) ───────

const CATEGORIES = ['STANDPUNT', 'ANALYSE', 'NUANCE', 'ADVIES'];

const CAT_BORDER_L: Record<string, string> = {
  STANDPUNT: 'border-l-[var(--ink-3)]',
  ANALYSE:   'border-l-green-500',
  NUANCE:    'border-l-amber-500',
  ADVIES:    'border-l-red-500',
};

const CAT_BG: Record<string, string> = {
  STANDPUNT: 'bg-[var(--ink-3)]',
  ANALYSE:   'bg-green-500',
  NUANCE:    'bg-amber-500',
  ADVIES:    'bg-red-500',
};

const CAT_TEXT: Record<string, string> = {
  STANDPUNT: 'text-[var(--ink-3)]',
  ANALYSE:   'text-green-500',
  NUANCE:    'text-amber-500',
  ADVIES:    'text-red-500',
};

const CAT_BORDER_B: Record<string, string> = {
  STANDPUNT: 'border-b-[var(--ink-3)]',
  ANALYSE:   'border-b-green-500',
  NUANCE:    'border-b-amber-500',
  ADVIES:    'border-b-red-500',
};

// ─── DraggableSourceCard ──────────────────────────────────────────────────────

const DraggableSourceCard: FC<{
  item: CanvasItem;
  member: CouncilMember;
  isAdded: boolean;
  onAdd: () => void;
}> = ({ item, member, isAdded, onAdd }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `src::${item.id}`,
    data: { type: 'source', item },
    disabled: isAdded,
  });

  return (
    <div
      ref={setNodeRef}
      className={`group relative border-l-[3px] border-2 overflow-hidden transition-all duration-200 select-none
        ${CAT_BORDER_L[item.category] ?? 'border-l-zinc-400'}
        ${isDragging ? 'opacity-20' : 'opacity-100'}
        ${isAdded
          ? 'border-black/8 dark:border-white/8 bg-black/2 dark:bg-white/2 cursor-default'
          : 'bg-white dark:bg-zinc-900 border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:shadow-sm cursor-grab active:cursor-grabbing'
        }`}
      {...(!isAdded ? { ...attributes, ...listeners } : {})}
    >
      {/* Member row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <img
          src={member.avatar}
          alt=""
          className="w-5 h-5 rounded-full object-cover shrink-0 border border-black/10"
        />
        <span className="text-[9px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 flex-1 truncate">
          {member.name}
        </span>
        {isAdded ? (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[var(--ink)] shrink-0">
            <CheckIcon className="w-2.5 h-2.5" />
            op canvas
          </span>
        ) : (
          <button
            type="button"
            title={`${item.category} van ${member.name} toevoegen`}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onAdd(); }}
            className="opacity-60 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-[var(--action)] text-white p-1 shrink-0 hover:scale-110 active:scale-95"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Content preview */}
      <div className={`px-3 pb-3 text-xs leading-relaxed line-clamp-3 ${
        isAdded ? 'text-black/20 dark:text-white/15' : 'text-black/65 dark:text-white/55'
      }`}>
        {item.content}
      </div>

      {/* Drag hint icon */}
      {!isAdded && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none">
          <GripVertical className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

// ─── SortableCanvasCard ────────────────────────────────────────────────────────

const SortableCanvasCard: FC<{
  item: CanvasItem;
  member: CouncilMember;
  onRemove: () => void;
}> = ({ item, member, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  // Apply dnd-kit runtime transform imperatively to avoid inline style prop
  const cardRef = useRef<HTMLDivElement>(null);
  const mergedRef = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [setNodeRef]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = CSS.Transform.toString(transform) ?? '';
    el.style.transition = transition ?? 'transform 180ms cubic-bezier(0.25, 1, 0.5, 1)';
  }, [transform, transition]);

  return (
    <div
      ref={mergedRef}
      className={`group relative border-l-[4px] border-2 border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 hover:border-black dark:hover:border-white hover:shadow-sm transition-shadow duration-200
        ${CAT_BORDER_L[item.category] ?? 'border-l-zinc-400'}
        ${isDragging ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-black/5 dark:border-white/5">
        {/* Grip handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 touch-none shrink-0"
          role="button"
          aria-label="Versleep om volgorde te wijzigen"
          tabIndex={0}
        >
          <GripVertical className="w-3.5 h-3.5 text-black/25 dark:text-white/25" />
        </div>

        {/* Category badge */}
        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 text-white shrink-0 ${CAT_BG[item.category] ?? 'bg-[var(--action)]'}`}>
          {item.category}
        </span>

        {/* Member */}
        <img src={member.avatar} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-black/35 dark:text-white/35 truncate flex-1">
          {member.name}
        </span>

        {/* Remove */}
        <button
          type="button"
          title="Verwijder van canvas"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 hover:text-red-500 text-black/25 dark:text-white/25 rounded shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 text-xs leading-relaxed text-black/75 dark:text-white/65 prose prose-sm max-w-none prose-p:my-1 prose-p:text-black dark:prose-p:text-white/65 prose-strong:text-black dark:prose-strong:text-white prose-ul:my-1 prose-li:my-0.5">
        <ReactMarkdown>{item.content}</ReactMarkdown>
      </div>
    </div>
  );
};

// ─── DragOverlayCard ──────────────────────────────────────────────────────────

const DragOverlayCard: FC<{ item: CanvasItem; member: CouncilMember }> = ({ item, member }) => (
  <div className={`border-l-[4px] border-2 border-black bg-white dark:bg-zinc-900 shadow-md rotate-[0.8deg] max-w-xs pointer-events-none ${CAT_BORDER_L[item.category] ?? 'border-l-zinc-400'}`}>
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-black/10">
      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 text-white shrink-0 ${CAT_BG[item.category] ?? 'bg-[var(--action)]'}`}>
        {item.category}
      </span>
      <img src={member.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
      <span className="text-[9px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest truncate">
        {member.name}
      </span>
    </div>
    <p className="px-4 py-3 text-xs text-black/70 line-clamp-3 leading-relaxed">{item.content}</p>
  </div>
);

// ─── EmptyDropZone ────────────────────────────────────────────────────────────

const EmptyDropZone: FC<{ isOver: boolean }> = ({ isOver }) => (
  <div className={`flex flex-col items-center justify-center h-60 border-[3px] border-dashed transition-all duration-300 ${
    isOver
      ? 'border-[var(--line)] bg-[var(--action)]/5 scale-[1.01]'
      : 'border-black/12 dark:border-white/12'
  }`}>
    <Layers className={`w-9 h-9 mb-3 transition-colors duration-300 ${
      isOver ? 'text-[var(--ink)]' : 'text-black/18 dark:text-white/18'
    }`} />
    <p className={`text-xs font-black uppercase tracking-widest transition-colors ${
      isOver ? 'text-[var(--ink)]' : 'text-black/25 dark:text-white/25'
    }`}>
      {isOver ? 'Laat los om toe te voegen' : 'Canvas is leeg'}
    </p>
    <p className="text-[10px] text-black/18 dark:text-white/18 mt-1.5 font-medium">
      Sleep compartimenten hiernaartoe of gebruik de + knop links
    </p>
  </div>
);

// ─── CompositionStage ─────────────────────────────────────────────────────────

export const CompositionStage: FC<CompositionStageProps> = ({ responses, members, onCompose }) => {
  const getMember = useCallback((id: string) => members.find(m => m.id === id), [members]);

  const allSourceItems = useCallback((): CanvasItem[] => {
    const items: CanvasItem[] = [];
    responses.forEach(resp => {
      if (!resp.sections) return;
      CATEGORIES.forEach(cat => {
        const content = resp.sections![cat];
        if (content?.trim()) {
          items.push({
            id: `${resp.memberId}::${cat}`,
            memberId: resp.memberId,
            category: cat,
            content: content.trim(),
          });
        }
      });
    });
    return items;
  }, [responses]);

  const sourceItems = useMemo(() => allSourceItems(), [allSourceItems]);

  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [activeItem, setActiveItem] = useState<CanvasItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>(CATEGORIES[0]);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pre-populate canvas with all compartments on first render so users see results immediately
  useEffect(() => {
    const items = allSourceItems();
    if (items.length > 0) setCanvasItems(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { setNodeRef: dropRef, isOver } = useDroppable({ id: 'canvas-drop' });

  const inCanvas = (id: string) => canvasItems.some(i => i.id === id);

  const addItem = (item: CanvasItem) => {
    setCanvasItems(prev => prev.some(i => i.id === item.id) ? prev : [...prev, item]);
  };

  const removeItem = (id: string) => {
    setCanvasItems(prev => prev.filter(i => i.id !== id));
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    const srcItem = active.data.current?.item as CanvasItem | undefined;
    const canvasItem = canvasItems.find(i => i.id === active.id);
    setActiveItem(srcItem ?? canvasItem ?? null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveItem(null);
    if (!over) return;

    const isSrc = String(active.id).startsWith('src::');

    if (isSrc) {
      const item = active.data.current?.item as CanvasItem;
      if (!item || inCanvas(item.id)) return;

      if (over.id === 'canvas-drop') {
        addItem(item);
      } else {
        const overIdx = canvasItems.findIndex(i => i.id === over.id);
        if (overIdx !== -1) {
          setCanvasItems(prev => {
            if (prev.some(i => i.id === item.id)) return prev;
            const next = [...prev];
            next.splice(overIdx, 0, item);
            return next;
          });
        } else {
          addItem(item);
        }
      }
    } else {
      // Reorder within canvas
      if (active.id !== over.id) {
        setCanvasItems(prev => {
          const from = prev.findIndex(i => i.id === active.id);
          const to   = prev.findIndex(i => i.id === over.id);
          if (from === -1 || to === -1) return prev;
          return arrayMove(prev, from, to);
        });
      }
    }
  };

  const composed = canvasItems.map(i => i.content).join('\n\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(composed).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  const toggleItem = (item: CanvasItem) => {
    if (inCanvas(item.id)) removeItem(item.id);
    else addItem(item);
  };

  const tabItems = sourceItems.filter(i => i.category === activeTab);
  const canvasIds = canvasItems.map(i => i.id);

  const addedByTab = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = sourceItems.filter(i => i.category === cat && inCanvas(i.id)).length;
    return acc;
  }, {} as Record<string, number>);

  const totalByTab = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = sourceItems.filter(i => i.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--action)] text-white text-[9px] font-black uppercase tracking-[0.3em] border-2 border-black">
            <Sparkles className="w-3 h-3" />
            Sketchboard · Drag &amp; Drop Compositie
          </div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black dark:text-white">
            Smeed jouw <span className="text-[var(--ink)]">eindoordeel</span>
          </h2>
          <p className="text-sm text-black/45 dark:text-white/45 font-bold max-w-xl mx-auto">
            {isMobile
              ? 'Selecteer de onderdelen die je het belangrijkst vindt. Victor weegt je selectie mee in het eindoordeel.'
              : 'Alle inzichten staan al klaar op het canvas. Verwijder wat je niet nodig hebt, herschik naar prioriteit — of vraag Victor meteen om zijn eindoordeel.'}
          </p>
        </div>

        {/* ── Mobile: Checkbox interface ────────────────────────── */}
        {isMobile ? (
          <div className="space-y-4">
            {CATEGORIES.map(cat => {
              const items = sourceItems.filter(i => i.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat} className="border-2 border-black/10 dark:border-white/10 overflow-hidden">
                  <div className={`px-3 py-2 ${CAT_BG[cat] || 'bg-black/5'}`}>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-white">{cat}</span>
                  </div>
                  <div className="divide-y divide-black/5 dark:divide-white/5">
                    {items.map(item => {
                      const member = getMember(item.memberId);
                      const checked = inCanvas(item.id);
                      return (
                        <label key={item.id} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleItem(item)}
                            className="mt-1 w-4 h-4 accent-[var(--action)] shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40">{member?.name}</span>
                            <p className="text-xs font-bold text-black/70 dark:text-white/60 leading-relaxed line-clamp-3">{item.content}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onCompose(composed)}
                disabled={canvasItems.length === 0}
                className="flex-1 btn-send justify-center py-4 disabled:opacity-30"
              >
                <Gavel className="w-5 h-5" /> Victor's eindoordeel ophalen
              </button>
            </div>
          </div>
        ) : (
        <>
        {/* ── Desktop: DnD grid ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">

          {/* ── Source Panel ──────────────────────────────────────── */}
          <aside className="flex flex-col border-2 border-black dark:border-white/20 overflow-hidden">
            <div className="px-4 py-3 bg-black dark:bg-zinc-900 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
                Compartimenten
              </span>
              <span className="text-[11px] font-black text-[var(--ink)]">
                {sourceItems.length} beschikbaar
              </span>
            </div>

            {/* Category tabs */}
            <div className="flex border-b-2 border-black dark:border-white/10 bg-white dark:bg-zinc-900">
              {CATEGORIES.map(cat => {
                const isActive = activeTab === cat;
                const added = addedByTab[cat] ?? 0;
                const total = totalByTab[cat] ?? 0;
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`flex-1 py-3 relative border-b-2 -mb-0.5 transition-all ${
                      isActive
                        ? `${CAT_BORDER_B[cat] ?? 'border-b-zinc-400'} ${CAT_TEXT[cat] ?? 'text-[var(--ink)]'}`
                        : 'border-b-transparent text-black/40 dark:text-white/35 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider block leading-tight">{cat}</span>
                    {added > 0 ? (
                      <span className={`text-[9px] font-black block mt-0.5 ${CAT_TEXT[cat] ?? 'text-[var(--ink)]'}`}>{added}/{total}</span>
                    ) : (
                      <span className="text-[9px] text-black/25 dark:text-white/20 block mt-0.5">{total}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Source cards */}
            <div className="flex flex-col gap-2.5 p-3 max-h-[40vh] lg:max-h-[520px] overflow-y-auto bg-white dark:bg-zinc-900/50">
              {tabItems.length === 0 ? (
                <div className="text-center py-10 text-[10px] text-black/25 dark:text-white/25 font-black uppercase tracking-widest">
                  Geen {activeTab} compartimenten
                </div>
              ) : (
                tabItems.map(item => {
                  const member = getMember(item.memberId);
                  if (!member) return null;
                  return (
                    <DraggableSourceCard
                      key={item.id}
                      item={item}
                      member={member}
                      isAdded={inCanvas(item.id)}
                      onAdd={() => addItem(item)}
                    />
                  );
                })
              )}
            </div>

            {/* Add all */}
            <div className="border-t-2 border-black/10 dark:border-white/10 p-3 bg-white dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => tabItems.forEach(i => { if (!inCanvas(i.id)) addItem(i); })}
                disabled={tabItems.every(i => inCanvas(i.id))}
                className="w-full text-[9px] font-black uppercase tracking-widest text-black/30 dark:text-white/30 hover:text-[var(--ink)] border border-dashed border-black/10 dark:border-white/10 hover:border-[var(--line)] py-2.5 transition-all disabled:opacity-25 disabled:pointer-events-none"
              >
                + Alle {activeTab} toevoegen aan canvas
              </button>
            </div>
          </aside>

          {/* ── Canvas Panel ─────────────────────────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Toolbar */}
            <div className="flex items-center justify-between min-h-6">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-black/40 dark:text-white/35">
                Canvas · {canvasItems.length} compartiment{canvasItems.length !== 1 ? 'en' : ''}
              </span>

              {canvasItems.length > 0 && (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowPreview(p => !p)}
                    className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/40 dark:text-white/35 hover:text-[var(--ink)] transition-colors"
                  >
                    {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showPreview ? 'Verberg' : 'Preview'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/40 dark:text-white/35 hover:text-[var(--ink)] transition-colors"
                  >
                    {copied
                      ? <CheckIcon className="w-3.5 h-3.5 text-green-500" />
                      : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Gekopieerd!' : 'Kopieer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanvasItems([])}
                    className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black/25 dark:text-white/25 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Sortable drop zone */}
            <SortableContext items={canvasIds} strategy={verticalListSortingStrategy}>
              <div
                ref={dropRef}
                className={`flex flex-col gap-3 min-h-60 transition-all duration-200 ${
                  isOver && canvasItems.length === 0
                    ? 'ring-2 ring-zinc-300'
                    : ''
                }`}
              >
                {canvasItems.length === 0 ? (
                  <EmptyDropZone isOver={isOver} />
                ) : (
                  canvasItems.map(item => {
                    const member = getMember(item.memberId);
                    if (!member) return null;
                    return (
                      <SortableCanvasCard
                        key={item.id}
                        item={item}
                        member={member}
                        onRemove={() => removeItem(item.id)}
                      />
                    );
                  })
                )}
              </div>
            </SortableContext>

            {/* Live Preview */}
            {showPreview && canvasItems.length > 0 && (
              <div className="border-2 border-black/12 dark:border-white/12 p-6 bg-white dark:bg-zinc-900 animate-in slide-in-from-top-3 duration-250">
                <div className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--ink)] mb-4">
                  Live Preview — Jouw compositie
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none opacity-80
                  prose-p:text-black dark:prose-p:text-white/65
                  prose-strong:text-black dark:prose-strong:text-white
                  prose-ul:my-1 prose-li:my-0.5">
                  <ReactMarkdown>{composed}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Action Bar ─────────────────────────────────────────── */}
        <div className="border-4 border-black dark:border-[var(--line)] bg-white dark:bg-black p-6 md:p-8 shadow-[8px_8px_0_0_black] dark:shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-[var(--ink)]">
                {canvasItems.length > 0
                  ? `${canvasItems.length} compartiment${canvasItems.length !== 1 ? 'en' : ''} in jouw compositie`
                  : 'Canvas is leeg'}
              </h4>
              <p className="text-xs text-black/40 dark:text-white/40 font-medium mt-1">
                {canvasItems.length > 0
                  ? "Jouw samenstelling wordt de basis voor Victor's eindoordeel."
                  : 'Sleep compartimenten naar het canvas of gebruik de + knoppen.'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
              <button
                type="button"
                onClick={handleCopy}
                disabled={canvasItems.length === 0}
                className="flex items-center gap-2 px-5 py-3.5 border-2 border-black dark:border-white text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all disabled:opacity-25 disabled:pointer-events-none"
              >
                <Share2 className="w-3.5 h-3.5" />
                Delen
              </button>

              <button
                type="button"
                onClick={() => onCompose(composed)}
                disabled={canvasItems.length === 0}
                className="flex items-center gap-3 px-8 py-4 bg-black text-white font-black text-sm uppercase tracking-widest hover:bg-[var(--action)] hover:text-black transition-all hover:scale-105 active:scale-95 shadow-md border-4 border-black disabled:opacity-25 disabled:pointer-events-none disabled:hover:scale-100"
              >
                <Gavel className="w-5 h-5" />
                Vraag Victor om oordeel
              </button>
            </div>
          </div>
        </div>
        </>
        )}

      </div>

      {/* ── Drag Overlay ───────────────────────────────────────── */}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeItem && getMember(activeItem.memberId) && (
          <DragOverlayCard
            item={activeItem}
            member={getMember(activeItem.memberId)!}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};
