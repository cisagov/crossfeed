import { renderHook, act } from '@testing-library/react';
import { useUserActivityTimeout } from '../useUserActivityTimeout';
import { advanceTo, clear } from 'jest-date-mock';

jest.useFakeTimers();

describe('useUserActivityTimeout', () => {
  afterEach(() => {
    clear();
    jest.clearAllTimers();
  });

  it('should set timeout status to true after given time', () => {
    advanceTo(new Date(2023, 7, 23, 0, 0, 0)); // Set the current date time
    const { result } = renderHook(() => useUserActivityTimeout(3000, true));
    act(() => {
      jest.advanceTimersByTime(4000); // Advance the timers
    });
    expect(result.current.isTimedOut).toBe(true);
  });

  it('should not set timeout status to true if logged out', () => {
    advanceTo(new Date(2023, 7, 23, 0, 0, 0));
    const { result } = renderHook(() => useUserActivityTimeout(3000, false));
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(result.current.isTimedOut).toBe(false);
  });

  it('should reset the timeout status on reset', () => {
    advanceTo(new Date(2023, 7, 23, 0, 0, 0));
    const { result } = renderHook(() => useUserActivityTimeout(3000, true));
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    act(() => {
      result.current.resetTimeout(); // Call resetTimeout function
    });
    expect(result.current.isTimedOut).toBe(false);
  });
});
