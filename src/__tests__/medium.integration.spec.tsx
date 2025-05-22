import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, within, act, waitFor } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event } from '../types';

const mockEvents: Event[] = [
  {
    id: '2b7545a6-ebee-426c-b906-2329bc8d62bd',
    title: '팀 회의',
    date: '2025-05-20',
    startTime: '10:00',
    endTime: '11:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  },
];

// ! Hard 여기 제공 안함
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return { ...render(<ChakraProvider>{element}</ChakraProvider>), user }; // ? Med: 왜 ChakraProvider로 감싸는지 물어보자
};

// ! Hard 여기 제공 안함
const saveSchedule = async (user: UserEvent, form: Omit<Event, 'id' | 'notificationTime'>) => {
  const { title, date, startTime, endTime, location, description, category, repeat } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.selectOptions(screen.getByLabelText('카테고리'), category);

  const checkbox = screen.getByLabelText('반복 일정') as HTMLInputElement;
  if (repeat.type !== 'none') {
    if (!checkbox.checked) await user.click(checkbox); // 반복 켜기
    await user.selectOptions(screen.getByLabelText('반복 유형'), repeat.type);
    await user.clear(screen.getByLabelText('반복 간격'));
    await user.type(screen.getByLabelText('반복 간격'), String(repeat.interval));
    if (repeat.endDate) {
      await user.type(screen.getByLabelText('반복 종료일'), repeat.endDate);
    }
  } else {
    if (checkbox.checked) await user.click(checkbox); // 반복 끄기
  }

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('일정 CRUD 및 기본 기능', () => {
  it('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
    setupMockHandlerCreation([...mockEvents]);

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('새 회의')).toBeInTheDocument();
    expect(eventList.getByText('2025-10-15')).toBeInTheDocument();
    expect(eventList.getByText('14:00 - 15:00')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 진행 상황 논의')).toBeInTheDocument();
    expect(eventList.getByText('회의실 A')).toBeInTheDocument();
    expect(eventList.getByText('카테고리: 업무')).toBeInTheDocument();
  });

  it('기존 일정의 세부 정보를 수정하고 변경사항이 정확히 반영된다', async () => {
    const { user } = setup(<App />);

    setupMockHandlerUpdating();

    await user.click(await screen.findByLabelText('Edit event'));

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 회의');
    await user.clear(screen.getByLabelText('설명'));
    await user.type(screen.getByLabelText('설명'), '회의 내용 변경');

    await user.click(screen.getByTestId('event-submit-button'));

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('수정된 회의')).toBeInTheDocument();
    expect(eventList.getByText('회의 내용 변경')).toBeInTheDocument();
  });

  it('일정을 삭제하고 더 이상 조회되지 않는지 확인한다', async () => {
    setupMockHandlerDeletion();

    const { user } = setup(<App />);
    const eventList = within(screen.getByTestId('event-list'));
    expect(await eventList.findByText('스터디1')).toBeInTheDocument();

    // 삭제 버튼 클릭
    const allDeleteButton = await screen.findAllByLabelText('Delete event');
    await user.click(allDeleteButton[0]);

    expect(eventList.queryByText('스터디1')).not.toBeInTheDocument();
  });
});

describe('일정 뷰', () => {
  it('주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않는다.', async () => {
    // ! 현재 시스템 시간 2025-10-01
    const { user } = setup(<App />);

    await user.selectOptions(screen.getByLabelText('view'), 'week');

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('주별 뷰 선택 후 해당 일자에 일정이 존재한다면 해당 일정이 정확히 표시된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번주 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번주 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
    });

    await user.selectOptions(screen.getByLabelText('view'), 'week');

    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getByText('이번주 팀 회의')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 없으면, 일정이 표시되지 않아야 한다.', async () => {
    vi.setSystemTime(new Date('2025-01-01'));

    setup(<App />);

    // ! 일정 로딩 완료 후 테스트
    await screen.findByText('일정 로딩 완료!');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 정확히 표시되는지 확인한다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);
    await saveSchedule(user, {
      title: '이번달 팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '이번달 팀 회의입니다.',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
    });

    const monthView = within(screen.getByTestId('month-view'));
    expect(monthView.getByText('이번달 팀 회의')).toBeInTheDocument();
  });

  it('달력에 1월 1일(신정)이 공휴일로 표시되는지 확인한다', async () => {
    vi.setSystemTime(new Date('2025-01-01'));
    setup(<App />);

    const monthView = screen.getByTestId('month-view');

    // 1월 1일 셀 확인
    const januaryFirstCell = within(monthView).getByText('1').closest('td')!;
    expect(within(januaryFirstCell).getByText('신정')).toBeInTheDocument();
  });

  // 반복 뱃지 테스트
  it('반복 일정에는 반복 뱃지가 표시되고, 단일 일정에는 표시되지 않는다', async () => {
    setupMockHandlerCreation([
      {
        id: 'repeat-1',
        title: '반복 회의',
        date: '2025-10-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'daily', interval: 1, endDate: '2025-10-20' },
        notificationTime: 0,
      },
      {
        id: 'single-1',
        title: '단일 회의',
        date: '2025-10-15',
        startTime: '13:00',
        endTime: '14:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 0,
      },
    ]);

    setup(<App />);

    const eventItems = await screen.findAllByTestId('event-item');
    const repeatBox = eventItems.find((el) => within(el).queryByText('반복 회의'));
    expect(within(repeatBox!).getByTestId('repeat-icon')).toBeInTheDocument();

    const singleBox = eventItems.find((el) => within(el).queryByText('단일 회의'));
    expect(within(singleBox!).queryByTestId('repeat-icon')).toBeNull();
  });

  it('반복일정을 수정하면 단일 일정으로 변경되고 반복 아이콘이 사라진다.', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '수정할 반복 일정',
        date: '2025-10-20',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-30' },
        notificationTime: 10,
      },
      {
        id: '2',
        title: '수정할 반복 일정',
        date: '2025-10-27',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-10-30' },
        notificationTime: 10,
      },
    ]);

    const { user } = setup(<App />);

    await screen.findByText('일정 로딩 완료!');

    const editButtons = await screen.findAllByLabelText('Edit event');
    await user.click(editButtons[1]);

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 회의');

    await user.click(screen.getByTestId('event-submit-button'));

    const eventList = screen.getByTestId('event-list');
    const eventBoxes = within(eventList)
      .getAllByRole('generic')
      .filter(
        (box) => box.textContent?.includes('수정된 회의') || box.textContent?.includes('기존 회의')
      );

    const modifiedEventBox = eventBoxes.find((box) => box.textContent?.includes('수정된 회의'));
    expect(
      within(modifiedEventBox as HTMLElement).queryByTestId('repeat-icon')
    ).not.toBeInTheDocument();
  });

  it('반복 일정의 특정 일정을 삭제하면 다른 반복 일정은 유지된다.', async () => {
    setupMockHandlerDeletion();

    const { user } = setup(<App />);

    const eventList = screen.getByTestId('event-list');

    // 개수 확인 (렌더된 이벤트 타이틀 기준)
    const itemsBefore = await screen.findAllByText((content) =>
      ['스터디1', '스터디2', '스터디3'].includes(content)
    );
    expect(itemsBefore.length).toBeGreaterThanOrEqual(3); // 중복 렌더 고려

    // 삭제 대상: '스터디2' + '2025-10-15'
    const target = Array.from(eventList.querySelectorAll('*')).find(
      (el) => el.textContent?.includes('스터디2') && el.textContent.includes('2025-10-15')
    ) as HTMLElement;
    expect(target).toBeTruthy();

    const deleteBtn = within(target).getByRole('button', { name: /Delete event/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(screen.queryByText('스터디2')).not.toBeInTheDocument();
    });

    expect(within(eventList).getByText('스터디1')).toBeInTheDocument();
    expect(within(eventList).getByText('스터디3')).toBeInTheDocument();
  });
});

describe('검색 기능', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: '1',
              title: '팀 회의',
              date: '2025-10-15',
              startTime: '09:00',
              endTime: '10:00',
              description: '주간 팀 미팅',
              location: '회의실 A',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
            {
              id: '2',
              title: '프로젝트 계획',
              date: '2025-10-16',
              startTime: '14:00',
              endTime: '15:00',
              description: '새 프로젝트 계획 수립',
              location: '회의실 B',
              category: '업무',
              repeat: { type: 'none', interval: 0 },
              notificationTime: 10,
            },
          ],
        });
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('검색 결과가 없으면, "검색 결과가 없습니다."가 표시되어야 한다.', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '존재하지 않는 일정');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it("'팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출된다", async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
  });

  it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', async () => {
    const { user } = setup(<App />);

    const searchInput = screen.getByPlaceholderText('검색어를 입력하세요');
    await user.type(searchInput, '팀 회의');
    await user.clear(searchInput);

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
    expect(eventList.getByText('프로젝트 계획')).toBeInTheDocument();
  });
});

describe('일정 충돌', () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it('겹치는 시간에 새 일정을 추가할 때 경고가 표시된다', async () => {
    setupMockHandlerCreation([
      {
        id: '1',
        title: '기존 회의',
        date: '2025-10-15',
        startTime: '09:00',
        endTime: '10:00',
        description: '기존 팀 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ]);

    const { user } = setup(<App />);

    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '09:30',
      endTime: '10:30',
      description: '설명',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
    });

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });

  it('기존 일정의 시간을 수정하여 충돌이 발생하면 경고가 노출된다', async () => {
    setupMockHandlerUpdating();

    const { user } = setup(<App />);

    const editButton = (await screen.findAllByLabelText('Edit event'))[1];
    await user.click(editButton);

    // 시간 수정하여 다른 일정과 충돌 발생
    await user.clear(screen.getByLabelText('시작 시간'));
    await user.type(screen.getByLabelText('시작 시간'), '08:30');
    await user.clear(screen.getByLabelText('종료 시간'));
    await user.type(screen.getByLabelText('종료 시간'), '10:30');

    await user.click(screen.getByTestId('event-submit-button'));

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
    expect(screen.getByText(/다음 일정과 겹칩니다/)).toBeInTheDocument();
    expect(screen.getByText('기존 회의 (2025-10-15 09:00-10:00)')).toBeInTheDocument();
  });
});

it('notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출된다', async () => {
  vi.setSystemTime(new Date('2025-10-15 08:49:59'));

  setup(<App />);

  // ! 일정 로딩 완료 후 테스트
  await screen.findByText('일정 로딩 완료!');

  expect(screen.queryByText('10분 후 기존 회의 일정이 시작됩니다.')).not.toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(screen.getByText('10분 후 기존 회의 일정이 시작됩니다.')).toBeInTheDocument();
});

// medium.integration.spec.tsx
// 심화과제 팀 활동
describe('반복 간격', () => {
  it('반복 간격을 설정하지 않으면 기본값으로 1이 설정되어야 한다.', () => {
    setup(<App />);

    const repeatInterval = screen.getByLabelText('repeat-interval');
    expect(repeatInterval).toHaveValue(1);
  });

  it('반복 간격이 1 미만이라면, 경고 메시지가 표시되어야 한다. (복사 붙여넣기 동작)', async () => {
    const { user } = setup(<App />);
    const repeatInterval = screen.getByLabelText('repeat-interval');

    await user.clear(repeatInterval);
    await user.type(repeatInterval, '0');
    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 0, endDate: '2025-10-20' },
    });

    expect(screen.getByText('반복 간격은 1에서 12 사이의 숫자여야 합니다.')).toBeInTheDocument();
  });

  it('반복 간격이 12 초과라면 경고 메시지가 표시되어야 한다. (복사 붙여넣기 동작)', async () => {
    const { user } = setup(<App />);
    const repeatInterval = screen.getByLabelText('repeat-interval');

    await user.clear(repeatInterval);
    await user.type(repeatInterval, '13');
    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 13, endDate: '2025-10-20' },
    });

    expect(screen.getByText('반복 간격은 1에서 12 사이의 숫자여야 합니다.')).toBeInTheDocument();
  });

  it('반복 간격이 유효한 숫자가 아니라면 경고 메시지가 표시되어야 한다.', async () => {
    const { user } = setup(<App />);
    const repeatInterval = screen.getByLabelText('repeat-interval');

    await user.clear(repeatInterval);
    await user.type(repeatInterval, '0');
    await user.type(repeatInterval, '222');
    await saveSchedule(user, {
      title: '새 회의',
      date: '2025-10-15',
      startTime: '14:00',
      endTime: '15:00',
      description: '프로젝트 진행 상황 논의',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'daily', interval: 222, endDate: '2025-10-20' },
    });

    expect(screen.getByText('반복 간격은 1에서 12 사이의 숫자여야 합니다.')).toBeInTheDocument();
  });
});

/**
 * 주어진 날짜 텍스트(`day`)로 시작하는 달력 셀(`<td>`)을 container에서 찾아 반환합니다.
 *
 * @param {HTMLElement} container - 달력의 테이블 컨테이너 요소입니다.
 * @param {string} day - 찾고자 하는 날짜의 숫자 문자열 (예: "15").
 * @returns {HTMLTableCellElement | undefined} - 조건에 맞는 <td> 요소 또는 찾지 못한 경우 undefined.
 */
const getDateCellByDay = (container: HTMLElement, day: string) => {
  return Array.from(container.querySelectorAll('td')).find((td) =>
    td.textContent?.trim().startsWith(day)
  );
};

describe('일정 알림 기능', () => {
  it('사용자가 알림 시간을 선택할 수 있다 (1분, 10분, 1시간, 1일 전)', async () => {
    setup(<App />);

    const notificationSelect = screen.getByLabelText('알림 설정') as HTMLSelectElement;

    // 각 옵션을 선택하면 -> 선택값이 noti어쩌고에 반영돼야 함
    const testCases = [
      { label: '1분 전', value: '1' },
      { label: '10분 전', value: '10' },
      { label: '1시간 전', value: '60' },
      { label: '1일 전', value: '1440' },
    ];

    for (const { value } of testCases) {
      await userEvent.selectOptions(notificationSelect, value);
      expect(notificationSelect.value).toBe(value);
    }
  });

  it('알림 시간에 도달하면 캘린더에 아이콘이 추가되고 색상이 변경되어 표시된다.', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-05-05T13:22:00'));

    const mockEvent: Event = {
      id: 'event-1',
      title: '어린이날 대운동회',
      date: '2025-05-05',
      startTime: '13:30',
      endTime: '16:00',
      description: '초등학교 운동회',
      location: '운동장',
      category: '가족',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    setupMockHandlerCreation([mockEvent]);
    setup(<App />);

    // 알림 체크 타이머가 돌아가게 함 (최소 1초 이상)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    const monthView = screen.getByTestId('month-view');
    const cell = getDateCellByDay(monthView, '5');
    expect(cell).toBeDefined();

    // 아이콘이 실제로 나타날 때까지 기다림
    const icon = await within(cell!).findByTestId('bell-icon');
    expect(icon).toBeInTheDocument();

    // 이벤트 텍스트도 확인
    expect(within(cell!).getByText(/어린이날 대운동회/)).toBeInTheDocument();
  });
});
