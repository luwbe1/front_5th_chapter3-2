import { Event } from '../../types';
import { isNumberInRange, validateRepeatEndDate } from '../../utils/validate';

// 심화과제 팀 활동
// validate
describe('isNumberInRange', () => {
  it('정상 범위 내 숫자는 true를 반환한다', () => {
    expect(isNumberInRange({ value: 5, min: 1, max: 10 })).toBe(true);
    expect(isNumberInRange({ value: 1, min: 1, max: 10 })).toBe(true);
    expect(isNumberInRange({ value: 10, min: 1, max: 10 })).toBe(true);
  });

  it('범위 밖의 숫자는 false를 반환한다', () => {
    expect(isNumberInRange({ value: 0, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: 11, min: 1, max: 10 })).toBe(false);
  });

  it('min, max가 지정되지 않은 경우 Infinity를 기본값으로 사용한다', () => {
    expect(isNumberInRange({ value: 999 })).toBe(true);
    expect(isNumberInRange({ value: -999 })).toBe(true);
  });

  it('NaN, Infinity, 문자, null, undefined 등 숫자가 아닌 값에는 false를 반환한다', () => {
    expect(isNumberInRange({ value: NaN, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: Infinity, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: -Infinity, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: '0005' as any, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: null as any, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: undefined as any, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: {} as any, min: 1, max: 10 })).toBe(false);
    expect(isNumberInRange({ value: [] as any, min: 1, max: 10 })).toBe(false);
  });
});

describe('validateRepeatEndDate', () => {
  it('종료일이 시작일보다 빠르면 에러 메시지를 반환한다', () => {
    const event: Event = {
      id: '1',
      title: '테스트 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-14' },
      notificationTime: 10,
    };

    const result = validateRepeatEndDate(event);
    expect(result).toBe('종료일은 시작일보다 늦어야 합니다.');
  });

  it('종료일이 시작일과 같으면 에러 메시지를 반환한다', () => {
    const event: Event = {
      id: '1',
      title: '테스트 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-15' },
      notificationTime: 10,
    };

    const result = validateRepeatEndDate(event);
    expect(result).toBe('종료일은 시작일보다 늦어야 합니다.');
  });

  it('종료일이 시작일보다 늦으면 null을 반환한다', () => {
    const event: Event = {
      id: '1',
      title: '테스트 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1, endDate: '2025-10-16' },
      notificationTime: 10,
    };

    const result = validateRepeatEndDate(event);
    expect(result).toBeNull();
  });

  it('종료일이 없으면 null을 반환한다', () => {
    const event: Event = {
      id: '1',
      title: '테스트 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '테스트 설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 1 },
      notificationTime: 10,
    };

    const result = validateRepeatEndDate(event);
    expect(result).toBeNull();
  });
});
