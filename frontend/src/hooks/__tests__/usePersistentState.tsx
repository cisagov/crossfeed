import React from 'react';
import { usePersistentState } from 'hooks';
import { render, fireEvent, waitFor } from 'test-utils';

jest.spyOn(Storage.prototype, 'setItem');
const setItemMock = jest.mocked(localStorage.setItem);

jest.spyOn(Storage.prototype, 'getItem');
const getItemMock = jest.mocked(localStorage.getItem);

interface TestCompProps {
  storagekey: string;
  defaultVal: any;
  onclick(dispatch: React.Dispatch<any>): void;
}
const TestComp: React.FC<TestCompProps> = ({
  storagekey,
  defaultVal,
  onclick
}) => {
  const [state, setState] = usePersistentState<any>(storagekey, defaultVal);

  return (
    <div>
      <div data-testid="state">{state}</div>
      <button data-testid="setState" onClick={(e) => onclick(setState)}>
        btn
      </button>
    </div>
  );
};

afterAll(() => {
  jest.restoreAllMocks();
});

afterEach(() => {
  setItemMock.mockReset();
  getItemMock.mockReset();
});

it('gives existing value if found', () => {
  getItemMock.mockReturnValue('1234');
  const { getByTestId } = render(
    <TestComp storagekey="testkey" defaultVal="5678" onclick={jest.fn()} />
  );
  expect(getByTestId('state')).toHaveTextContent('1234');
});

it('gives default value if none exists', () => {
  getItemMock.mockReturnValue(null);
  const { getByTestId } = render(
    <TestComp storagekey="testkey" defaultVal="zxcv" onclick={jest.fn()} />
  );
  expect(getByTestId('state')).toHaveTextContent('zxcv');
});

it('updates state with default value', () => {
  getItemMock.mockReturnValue(null);
  render(
    <TestComp storagekey="testkey" defaultVal="zxcv" onclick={jest.fn()} />
  );
  expect(setItemMock).toHaveBeenCalledTimes(1);
  expect(setItemMock).toHaveBeenCalledWith('testkey', JSON.stringify('zxcv'));
});

it('updates localStorage on call to setState', async () => {
  getItemMock.mockReturnValue(null);
  const onClick = (dispatch: React.Dispatch<any>) => dispatch('newval');
  const { getByTestId } = render(
    <TestComp storagekey="testkey" defaultVal="zxcv" onclick={onClick} />
  );
  expect(setItemMock).toHaveBeenCalledTimes(1);
  expect(setItemMock).toHaveBeenCalledWith('testkey', JSON.stringify('zxcv'));
  fireEvent.click(getByTestId('setState'));
  await waitFor(() => {
    expect(getByTestId('state')).toHaveTextContent('newval');
  });
  await waitFor(() => {
    expect(setItemMock).toHaveBeenCalledTimes(2);
    expect(setItemMock).toHaveBeenCalledWith(
      'testkey',
      JSON.stringify('newval')
    );
  });
});
