import { describe, it, expect } from 'vitest';

import { EventForm } from '@/types';
import { generateRecurringEvents } from '@/utils/generateRecurringEvents';

const baseEvent = (override: Partial<EventForm>): EventForm => ({
  title: '테스트',
  date: '2025-05-01',
  startTime: '09:00',
  endTime: '10:00',
  description: '',
  location: '',
  category: '업무',
  notificationTime: 10,
  repeat: {
    type: 'none',
    interval: 1,
    endDate: '2025-09-30',
    ...override.repeat,
  },
  ...override,
});

describe('generateRecurringEvents > 반복 유형 테스트', () => {
  // 반복 유형 테스트
  it('매일 반복(daily)', () => {
    const events = generateRecurringEvents(
      baseEvent({
        date: '2025-05-01',
        repeat: { type: 'daily', interval: 1, endDate: '2025-05-03' },
      })
    );
    expect(events.map((e) => e.date)).toEqual(['2025-05-01', '2025-05-02', '2025-05-03']);
  });

  it('매주 반복(weekly)', () => {
    const events = generateRecurringEvents(
      baseEvent({
        date: '2025-05-01',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-05-15' },
      })
    );
    expect(events.map((e) => e.date)).toEqual(['2025-05-01', '2025-05-08', '2025-05-15']);
  });

  it('매월 반복(monthly) - 31일 기준', () => {
    const events = generateRecurringEvents(
      baseEvent({
        date: '2025-01-31',
        repeat: { type: 'monthly', interval: 1, endDate: '2025-04-30' },
      })
    );
    expect(events.map((e) => e.date)).toEqual([
      '2025-01-31',
      '2025-02-28',
      '2025-03-31',
      '2025-04-30',
    ]);
  });

  it('매년 반복(yearly) - 윤년 시작', () => {
    const events = generateRecurringEvents(
      baseEvent({
        date: '2024-02-29',
        repeat: { type: 'yearly', interval: 1, endDate: '2027-03-01' },
      })
    );
    expect(events.map((e) => e.date)).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
    ]);
  });
});

describe('generateRecurringEvents > 반복 간격 테스트', () => {
  // 반복 간격 테스트
  it('2일마다 반복 (daily)', () => {
    const events = generateRecurringEvents(
      baseEvent({
        date: '2025-05-01',
        repeat: { type: 'daily', interval: 2, endDate: '2025-05-05' },
      })
    );
    expect(events.map((e) => e.date)).toEqual(['2025-05-01', '2025-05-03', '2025-05-05']);
  });

  it('2주마다 반복 (weekly)', () => {
    const events = generateRecurringEvents(
      baseEvent({
        date: '2025-05-01',
        repeat: { type: 'weekly', interval: 2, endDate: '2025-05-29' },
      })
    );
    expect(events.map((e) => e.date)).toEqual(['2025-05-01', '2025-05-15', '2025-05-29']);
  });

  it('2개월마다 반복 (monthly)', () => {
    const events = generateRecurringEvents(
      baseEvent({
        date: '2025-01-31',
        repeat: { type: 'monthly', interval: 2, endDate: '2025-07-31' },
      })
    );
    expect(events.map((e) => e.date)).toEqual([
      '2025-01-31',
      '2025-03-31',
      '2025-05-31',
      '2025-07-31',
    ]);
  });

  it('2년마다 반복 (yearly)', () => {
    const events = generateRecurringEvents(
      baseEvent({
        date: '2024-02-29',
        repeat: { type: 'yearly', interval: 2, endDate: '2030-02-28' },
      })
    );
    expect(events.map((e) => e.date)).toEqual([
      '2024-02-29',
      '2026-02-28',
      '2028-02-29',
      '2030-02-28',
    ]);
  });
});

describe('generateRecurringEvents - 반복 종료 조건 테스트', () => {
  it('종료일이 주어지면 그 날짜까지 반복된다', () => {
    const events = generateRecurringEvents(
      baseEvent({
        date: '2025-06-01',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: '2025-06-05',
        },
      })
    );

    expect(events.map((e) => e.date)).toEqual([
      '2025-06-01',
      '2025-06-02',
      '2025-06-03',
      '2025-06-04',
      '2025-06-05',
    ]);
  });

  it('종료일이 생략되면 기본값(2025-09-30)까지 반복된다', () => {
    const events = generateRecurringEvents(
      baseEvent({
        date: '2025-09-28',
        repeat: {
          type: 'daily',
          interval: 1,
          endDate: undefined, // 종료일 없음
        },
      })
    );

    // 기본 종료일이 2025-09-30이므로 28, 29, 30만 나와야 함
    expect(events.map((e) => e.date)).toEqual(['2025-09-28', '2025-09-29', '2025-09-30']);
  });
});
