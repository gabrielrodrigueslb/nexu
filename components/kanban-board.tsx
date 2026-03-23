import { Plus } from 'lucide-react';

import { cn } from '@/lib/utils';

export type KanbanColumn<TColumnId extends string, TItem> = {
  id: TColumnId;
  title: string;
  items: TItem[];
  count?: number;
  valueLabel?: string;
  accentClassName?: string;
};

type KanbanBoardProps<TColumnId extends string, TItem> = {
  columns: Array<KanbanColumn<TColumnId, TItem>>;
  getItemId: (item: TItem) => string;
  renderCard: (item: TItem, columnId: TColumnId) => React.ReactNode;
  onMoveItem?: (itemId: string, targetColumnId: TColumnId) => void;
  canDragItem?: (item: TItem) => boolean;
  onAddItem?: (columnId: TColumnId) => void;
  emptyLabel?: string;
};

export function KanbanBoard<TColumnId extends string, TItem>({
  columns,
  getItemId,
  renderCard,
  onMoveItem,
  canDragItem,
  onAddItem,
  emptyLabel = 'Vazio',
}: KanbanBoardProps<TColumnId, TItem>) {
  return (
    <div className="flex min-h-[calc(100vh-240px)] gap-[14px] overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column.id}
          onDragOver={(event) => {
            if (!onMoveItem) return;
            event.preventDefault();
          }}
          onDrop={(event) => {
            if (!onMoveItem) return;

            event.preventDefault();
            const itemId = event.dataTransfer.getData('application/kanban-item-id');
            if (!itemId) return;
            onMoveItem(itemId, column.id);
          }}
          className="flex min-h-[420px] w-[260px] shrink-0 flex-col rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc]"
        >
          <div className="flex items-center gap-2 border-b border-[#e2e8f0] px-[14px] py-3">
            <span
              className={cn(
                'text-[12px] font-bold tracking-[.06em] text-[#2563eb] uppercase',
                column.accentClassName,
              )}
            >
              {column.title}
            </span>
            <span className="rounded-full bg-[#e2e8f0] px-[7px] py-[2px] text-[11px] font-bold text-[#64748b]">
              {column.count ?? column.items.length}
            </span>
            {onAddItem ? (
              <button
                type="button"
                onClick={() => onAddItem(column.id)}
                className="ml-auto flex items-center rounded-[6px] border border-[#e2e8f0] px-2 py-[3px] text-[12px] text-[#64748b] transition-colors hover:bg-white hover:text-[#0f172a]"
                aria-label={`Adicionar item em ${column.title}`}
              >
                <Plus className="size-3" />
              </button>
            ) : null}
          </div>

          {column.valueLabel ? (
            <div className="px-3 pt-1 text-[11px] font-bold text-[#059669]">
              {column.valueLabel}
            </div>
          ) : null}

          <div className="flex flex-1 flex-col gap-2 p-[10px]">
            {column.items.length ? (
              column.items.map((item) => {
                const itemId = getItemId(item);
                const draggable = canDragItem ? canDragItem(item) : Boolean(onMoveItem);

                return (
                  <div
                    key={itemId}
                    draggable={draggable}
                    onDragStart={(event) => {
                      if (!draggable) {
                        event.preventDefault();
                        return;
                      }

                      event.dataTransfer.setData('application/kanban-item-id', itemId);
                    }}
                  >
                    {renderCard(item, column.id)}
                  </div>
                );
              })
            ) : (
              <div className="py-5 text-center text-[12px] text-[#64748b]">{emptyLabel}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
