import { Medal } from 'lucide-react';

import { cn } from '@/lib/utils';

import { formatMoney, progressColor, toneStyles } from './utils';

type Tone = 'accent' | 'success' | 'warning' | 'error' | 'purple' | 'neutral';

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[10px] border border-[#e2e8f0] bg-white shadow-[0_1px_3px_rgba(0,0,0,.08)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-[14px] mt-[28px]">
      <div className="text-[14px] font-extrabold tracking-[-0.2px] text-[#0f172a]">
        {title}
      </div>
      {description ? (
        <div className="mt-[2px] text-[12px] text-[#64748b]">{description}</div>
      ) : null}
    </div>
  );
}

export function MetricCard({
  icon,
  title,
  value,
  subtitle,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  tone: Tone;
}) {
  const styles = toneStyles(tone);

  return (
    <Panel className="flex items-start gap-[14px] p-[16px_18px]">
      <div
        className={cn(
          'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px]',
          styles.bg,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-[3px] text-[11px] font-bold tracking-[.05em] text-[#64748b] uppercase">
          {title}
        </div>
        <div className={cn('text-[24px] leading-[1.1] font-extrabold', styles.text)}>
          {value}
        </div>
        {subtitle ? (
          <div className="mt-1 text-[11px] text-[#64748b]">{subtitle}</div>
        ) : null}
      </div>
    </Panel>
  );
}

export function SmallPill({
  tone,
  children,
}: {
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-[2px] text-[11px] font-bold',
        toneStyles(tone).pill,
      )}
    >
      {children}
    </span>
  );
}

export function GoalBar({
  label,
  placeholder,
  actualValue,
  goalValue,
  isMoney,
  onChange,
}: {
  label: string;
  placeholder: string;
  actualValue: number;
  goalValue: number;
  isMoney: boolean;
  onChange: (value: number) => void;
}) {
  const width =
    goalValue > 0 ? Math.min(100, Math.round((actualValue / goalValue) * 100)) : 0;
  const color = progressColor(width);

  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex-1 text-[11px] text-[#64748b]">{label}</span>
        <input
          type="number"
          min={0}
          step={isMoney ? 100 : 1}
          value={goalValue || ''}
          placeholder={placeholder}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
          className="w-[110px] rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1 text-right text-[12px] text-[#0f172a] outline-none"
        />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#f8fafc]">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
      <div className="mt-[3px] flex justify-between text-[10px] text-[#64748b]">
        <span>{goalValue > 0 ? `${width}% da meta` : '-- da meta'}</span>
        <span>
          {goalValue > 0
            ? `Meta: ${isMoney ? formatMoney(goalValue) : goalValue}`
            : 'Meta: --'}
        </span>
      </div>
    </div>
  );
}

export function InlineGoalBar({
  actualValue,
  goalValue,
  onChangeGoal,
}: {
  actualValue: number;
  goalValue: number;
  onChangeGoal: (value: number) => void;
}) {
  const width =
    goalValue > 0 ? Math.min(100, Math.round((actualValue / goalValue) * 100)) : 0;
  const color = progressColor(width);

  return (
    <div className="flex items-center gap-[6px]">
      <input
        type="number"
        min={0}
        step={1}
        value={goalValue || ''}
        placeholder="Meta"
        onChange={(event) => onChangeGoal(Number(event.target.value) || 0)}
        className="w-[72px] rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-[7px] py-1 text-right text-[12px] text-[#0f172a] outline-none"
      />
      <div className="min-w-[60px] flex-1">
        <div className="h-[7px] overflow-hidden rounded-full bg-[#f8fafc]">
          <div
            className="h-full rounded-full"
            style={{ width: `${width}%`, background: color }}
          />
        </div>
        <div className="mt-[2px] text-[10px] text-[#64748b]">
          {goalValue > 0 ? `${width}%` : '--'}
        </div>
      </div>
    </div>
  );
}

export function InlineGoalBarMoney({
  actualValue,
  goalValue,
  onChangeGoal,
}: {
  actualValue: number;
  goalValue: number;
  onChangeGoal: (value: number) => void;
}) {
  const width =
    goalValue > 0 ? Math.min(100, Math.round((actualValue / goalValue) * 100)) : 0;
  const color = progressColor(width);

  return (
    <div className="flex items-center gap-[6px]">
      <input
        type="number"
        min={0}
        step={100}
        value={goalValue || ''}
        placeholder="R$ meta"
        onChange={(event) => onChangeGoal(Number(event.target.value) || 0)}
        className="w-[90px] rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-[7px] py-1 text-right text-[12px] text-[#0f172a] outline-none"
      />
      <div className="min-w-[70px] flex-1">
        <div className="h-[7px] overflow-hidden rounded-full bg-[#f8fafc]">
          <div
            className="h-full rounded-full"
            style={{ width: `${width}%`, background: color }}
          />
        </div>
        <div className="mt-[2px] text-[10px] text-[#64748b]">
          {goalValue > 0 ? `${width}% da meta` : '--'}
        </div>
      </div>
    </div>
  );
}

export function rankIcon(index: number) {
  if (index === 0) return <Medal className="size-4 text-[#d97706]" />;
  if (index === 1) return <Medal className="size-4 text-[#64748b]" />;
  if (index === 2) return <Medal className="size-4 text-[#92400e]" />;
  return <span className="text-[#64748b]">#{index + 1}</span>;
}

export function FragmentHeader() {
  return (
    <>
      <th className="border-l-2 border-[#e2e8f0] px-[8px] py-[6px] text-center text-[10px] font-bold text-[#64748b]">
        Qtd
      </th>
      <th className="px-[8px] py-[6px] text-center text-[10px] font-bold text-[#64748b]">
        Feitas
      </th>
    </>
  );
}
