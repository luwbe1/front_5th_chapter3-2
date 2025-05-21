import { EventForm, Event } from '../types';

export function isEndOfMonth(date: Date): boolean {
  const test = new Date(date);
  test.setDate(test.getDate() + 1);
  return test.getDate() === 1; // 다음 날이 1일이면 말일이었음
}

export function adjustDateForMonthEnd(
  base: Date,
  originalDay: number,
  forceEndOfMonth: boolean
): Date {
  const newDate = new Date(base);
  const year = newDate.getFullYear();
  const month = newDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const adjustedDay = forceEndOfMonth ? lastDay : Math.min(originalDay, lastDay);
  newDate.setDate(adjustedDay);
  return newDate;
}

export function generateRecurringEvents(event: EventForm | Event): EventForm[] {
  const results: EventForm[] = [];
  const start = new Date(event.date);
  const interval = event.repeat.interval || 1;
  const type = event.repeat.type;

  const DEFAULT_END = new Date('2025-09-30');
  const end = event.repeat.endDate ? new Date(event.repeat.endDate) : DEFAULT_END;

  let current = new Date(start);
  const originalDay = current.getDate();
  const forceEndOfMonth = isEndOfMonth(current);

  while (current <= end) {
    results.push({
      ...event,
      date: current.toISOString().slice(0, 10),
    });

    switch (type) {
      case 'daily':
        current.setDate(current.getDate() + interval);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7 * interval);
        break;
      case 'monthly': {
        const year = current.getFullYear();
        const month = current.getMonth() + interval;
        const target = new Date(year, month, 1);
        const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        const adjustedDay = forceEndOfMonth ? lastDay : Math.min(originalDay, lastDay);
        current = new Date(target.getFullYear(), target.getMonth(), adjustedDay);
        break;
      }
      case 'yearly': {
        const year = current.getFullYear() + interval;
        const month = current.getMonth();
        const target = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0).getDate();
        const adjustedDay = forceEndOfMonth ? lastDay : Math.min(originalDay, lastDay);
        current = new Date(year, month, adjustedDay);
        break;
      }
    }
  }

  return results;
}
