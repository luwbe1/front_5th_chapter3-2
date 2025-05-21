import { useToast } from '@chakra-ui/react';

import { EventForm, Event } from '../types';
import { generateRecurringEvents } from '../utils/generateRecurringEvents';

export const useRepeatEventOperations = (
  editing: boolean,
  onSave?: () => void,
  fetchEvents?: () => Promise<void>
) => {
  const toast = useToast();

  const saveRepeatEvents = async (baseEvent: EventForm | Event) => {
    try {
      const { repeat } = baseEvent;
      if (!repeat || repeat.type === 'none') {
        throw new Error('반복 정보가 없습니다.');
      }

      const repeatId = repeat.id || crypto.randomUUID();

      const updatedRepeat = { ...repeat, id: repeatId };
      const baseWithRepeatId = { ...baseEvent, repeat: updatedRepeat };

      const repeatedEvents = generateRecurringEvents(baseWithRepeatId);

      // 반복 일정 일괄 생성
      await fetch('/api/events-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: repeatedEvents }),
      });

      await fetchEvents?.();
      onSave?.();

      toast({
        title: editing ? '반복 일정으로 수정되었습니다.' : '반복 일정이 추가되었습니다.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('반복 일정 저장 실패:', error);
      toast({
        title: '반복 일정 저장 실패',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return { saveRepeatEvents };
};
