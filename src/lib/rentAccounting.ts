import type { RentRecord } from './types';

export function getRentTotal(record: RentRecord): number {
  const total = Number(record.total);
  if (Number.isFinite(total) && total > 0) return total;
  return Math.max(0, Number(record.amount) || 0);
}

export function getRentPaidAmount(record: RentRecord, total = getRentTotal(record)): number {
  const rawPaid = record.paidAmount !== undefined
    ? Number(record.paidAmount)
    : record.status === 'Received'
      ? total
      : 0;
  return Math.min(Math.max(0, Number.isFinite(rawPaid) ? rawPaid : 0), Math.max(0, total));
}

export function getRentRemainingAmount(record: RentRecord, total = getRentTotal(record)): number {
  const paid = getRentPaidAmount(record, total);
  return Math.max(0, total - paid);
}
