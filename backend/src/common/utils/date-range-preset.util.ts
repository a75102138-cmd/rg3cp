export type DateRangePreset = 'today' | 'week' | 'month';

export type DateRange = { from: Date; to: Date };

/** Début de semaine ISO (lundi 00:00 locale). */
function startOfIsoWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function resolveDateRangePreset(preset?: DateRangePreset): DateRange | undefined {
  if (!preset) return undefined;
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (preset === 'today') {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from, to: end };
  }

  if (preset === 'week') {
    const from = startOfIsoWeek(now);
    return { from, to: end };
  }

  if (preset === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    from.setHours(0, 0, 0, 0);
    return { from, to: end };
  }

  return undefined;
}
