import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { setupMockHandlerCreation } from '@/__mocks__/handlersUtils.ts';
import { useRepeatEventOperations } from '@/hooks/useRepeatEventOperations';
import { EventForm } from '@/types';

const toastFn = vi.fn();

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => toastFn,
  };
});

const baseEvent: EventForm = {
  title: '반복 일정',
  date: '2025-06-01',
  startTime: '09:00',
  endTime: '10:00',
  description: '',
  location: '',
  category: '업무',
  notificationTime: 10,
  repeat: {
    id: 'repeat-1',
    type: 'daily',
    interval: 1,
    endDate: '2025-06-03',
  },
};

it('반복 정보가 없을 경우 예외를 던지고 토스트를 표시한다', async () => {
  const { result } = renderHook(() => useRepeatEventOperations(false));

  await act(async () => {
    await result.current.saveRepeatEvents({ ...baseEvent, repeat: { type: 'none', interval: 0 } });
  });

  expect(toastFn).toHaveBeenCalledWith(
    expect.objectContaining({
      title: '반복 일정 저장 실패',
      status: 'error',
    })
  );
});

it('반복 일정이 정상적으로 저장되면 토스트가 뜨고 fetchEvents가 호출된다', async () => {
  setupMockHandlerCreation();

  const { result } = renderHook(() => useRepeatEventOperations(false));

  await act(() => Promise.resolve(null));

  await act(async () => {
    await result.current.saveRepeatEvents(baseEvent);
  });

  expect(toastFn).toHaveBeenCalledWith(
    expect.objectContaining({ title: '반복 일정이 추가되었습니다.', status: 'success' })
  );
});
