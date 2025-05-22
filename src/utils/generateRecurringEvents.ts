import { EventForm, Event } from '../types';

/**
 * 주어진 날짜가 해당 월의 마지막 날인지 확인
 * @param date 확인할 날짜
 * @returns 말일이면 true, 아니면 false
 */
export function isEndOfMonth(date: Date): boolean {
  const test = new Date(date);
  test.setDate(test.getDate() + 1);
  return test.getDate() === 1; // 다음 날이 1일이면 현재 날짜는 말일
}

/**
 * 월 말 반복 옵션을 고려하여 날짜를 조정
 * @param base 기준 날짜 (year, month 기준)
 * @param originalDay 반복 시작일의 일(day)
 * @param forceEndOfMonth 반복 시작일이 말일이었는지 여부
 * @returns 조정된 날짜
 */
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

/**
 * 반복 일정 생성 함수
 * @param event 반복 일정의 원본 이벤트
 * @returns 생성된 반복 일정 배열
 */
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
        const lastDay = new Date(year, month + 1, 0).getDate();
        const adjustedDay = forceEndOfMonth ? lastDay : Math.min(originalDay, lastDay);
        current = new Date(year, month, adjustedDay);
        break;
      }
    }
  }

  return results;
}
