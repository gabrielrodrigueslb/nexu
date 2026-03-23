import { X } from 'lucide-react';

export function ModalShell({
  open,
  title,
  description,
  maxWidthClassName = 'max-w-[720px]',
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  maxWidthClassName?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-[rgba(15,23,42,.55)] backdrop-blur-[2px]">
      <div
        className={`flex h-screen w-full flex-col overflow-y-auto bg-white shadow-[-20px_0_60px_rgba(0,0,0,.2)] ${maxWidthClassName}`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e2e8f0] bg-white px-6 py-[18px]">
          <div>
            <div className="text-[17px] font-extrabold tracking-[-0.3px] text-[#0f172a]">
              {title}
            </div>
            {description ? (
              <div className="mt-1 text-[12px] text-[#64748b]">{description}</div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border-[1.5px] border-[#e2e8f0] text-[#64748b] transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="scrollbar-minimal flex-1 px-6 py-[22px]">
          {children}
        </div>

        {footer ? (
          <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-[#e2e8f0] bg-white px-6 py-[14px]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
