/**
 * 심화과제 팀 활동
 * 주어진 숫자가 지정된 범위(포함)에 있는지 확인합니다.
 *
 * @param value - 검사할 숫자입니다.
 * @param min - 허용되는 최소값(포함)입니다. 기본값은 -Infinity입니다.
 * @param max - 허용되는 최대값(포함)입니다. 기본값은 Infinity입니다.
 * @returns 값이 유한한 숫자이고 범위 내에 있으면 `true`, 그렇지 않으면 `false`를 반환합니다.
 */
export function isNumberInRange({
  value,
  min = -Infinity,
  max = Infinity,
}: {
  value: number;
  min?: number;
  max?: number;
}): boolean {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;

  if (value < min || value > max) return false;

  return true;
}

/**
 * 반복 종료일이 시작일보다 늦은지 확인합니다.
 *
 * @param event - 검사할 이벤트입니다.
 * @returns 종료일이 시작일보다 빠르거나 같으면 에러 메시지를, 그렇지 않으면 null을 반환합니다.
 */
export function validateRepeatEndDate(event: {
  date: string;
  repeat: { endDate?: string };
}): string | null {
  if (!event.repeat.endDate) return null;

  const startDate = new Date(event.date);
  const endDate = new Date(event.repeat.endDate);

  if (endDate <= startDate) {
    return '종료일은 시작일보다 늦어야 합니다.';
  }

  return null;
}
