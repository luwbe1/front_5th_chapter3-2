import { useToast } from '@chakra-ui/react';

import { EventForm, Event } from '../types';
import { generateRecurringEvents } from '../utils/generateRecurringEvents';

/**
 * 반복 일정 저장 로직을 처리
 *
 * @param {boolean} editing - 현재 편집 모드 여부. true일 경우 수정, false일 경우 생성
 * @param {() => void} [onSave] - 저장 완료 후 실행할 콜백 함수
 * @param {() => Promise<void>} [fetchEvents] - 저장 후 일정 목록을 새로고침하는 함수
 * @returns {{
 *   saveRepeatEvents: (baseEvent: Event | EventForm) => Promise<void>
 * }} 반복 일정을 생성 및 저장하는 함수 객체를 반환
 */
export const useRepeatEventOperations = (
  editing: boolean,
  onSave?: () => void,
  fetchEvents?: () => Promise<void>
) => {
  const toast = useToast();

  /**
   * 반복 일정을 생성하고 서버에 저장하는 함수
   * 반복 ID가 없으면 새로 생성하고, 반복 정보를 포함한 이벤트들을 일괄 생성
   *
   * @param {EventForm | Event} baseEvent - 반복 정보를 포함한 기준 이벤트 객체
   */
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
