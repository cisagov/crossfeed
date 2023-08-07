import { renderHook, act } from '@testing-library/react-hooks';
import { useUserActivityTimeout } from '../useUserActivityTimeout';

jest.useFakeTimers();

describe('useUserActivityTimeout', () => {
  it('should set isTimedOut to true after timeout', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useUserActivityTimeout(5000, true)
    );

    expect(result.current).toBe(false);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    waitForNextUpdate();

    expect(result.current).toBe(true);
  });

  it('should reset timeout on user activity', () => {
    const map: any = {};

    window.addEventListener = jest.fn((event, cb) => {
      map[event] = cb;
    });

    const { result } = renderHook(() => useUserActivityTimeout(5000, true));

    expect(result.current).toBe(false);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    act(() => {
      map.mousemove();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current).toBe(false);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current).toBe(true);
  });
});
