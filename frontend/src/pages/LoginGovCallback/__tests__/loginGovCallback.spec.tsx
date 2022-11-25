import React from 'react';
import { render, waitFor } from 'test-utils';
import { LoginGovCallback } from '../LoginGovCallback';

jest.spyOn(Storage.prototype, 'getItem');
const mockGetItem = jest.mocked(localStorage.getItem);

jest.spyOn(Storage.prototype, 'removeItem');
const mockRemoveItem = jest.mocked(localStorage.removeItem);

// jest.mock('react-router-dom', () => ({
//   ...jest.requireActual('react-router-dom'),
//   useHistory: jest.fn()
// }));
// const mockRouter = jest.mocked(router);

// const mockHistory = {
//   push: jest.fn()
// };
const mockPost = jest.fn();
const mockLogin = jest.fn();
const { location: originalLocation } = window;

beforeAll(() => {
  delete window.location;
  window.location = {} as unknown as Location;
  // mockRouter.useHistory.mockReturnValue(
  //   (mockHistory as unknown) as ReturnType<typeof router.useHistory>
  // );
});

beforeEach(() => {
  mockPost.mockReset();
  mockLogin.mockReset();
  // mockHistory.push.mockReset();
});

afterAll(() => {
  window.location = originalLocation;
  jest.restoreAllMocks();
});

const renderMocked = () => {
  return render(<LoginGovCallback />, {
    authContext: {
      apiPost: mockPost,
      login: mockLogin
    }
  });
};

it('can handle successful OAuth callback', async () => {
  window.location.search = '?state=fake_oauth_state&code=fake_oauth_code';
  mockGetItem
    .mockReturnValueOnce('FAKE_NONCE')
    .mockReturnValueOnce('FAKE_STATE');
  mockPost.mockResolvedValue({ token: 'some_new_token' });
  renderMocked();
  await waitFor(() => {
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][0]).toEqual('/auth/callback');
    expect(mockPost.mock.calls[0][1]).toMatchObject({
      body: {
        state: 'fake_oauth_state',
        code: 'fake_oauth_code',
        nonce: 'FAKE_NONCE',
        origState: 'FAKE_STATE'
      }
    });
  });
  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin.mock.calls[0][0]).toEqual('some_new_token');
  });
  await waitFor(() => {
    expect(mockRemoveItem).toHaveBeenCalledTimes(2);
    expect(mockRemoveItem).toHaveBeenCalledWith('nonce');
    expect(mockRemoveItem).toHaveBeenCalledWith('state');
  });
  // await waitFor(() => {
  //   expect(mockHistory.push).toHaveBeenCalledTimes(1);
  //   expect(mockHistory.push).toHaveBeenCalledWith('/');
  // });
});

it('still navigates home on api errors', async () => {
  // on errors, since user was not logged in successfully,
  // navigating home will cause route guard to redirect appropriately
  window.location.search = '?state=fake_oauth_state&code=fake_oauth_code';
  mockGetItem
    .mockReturnValueOnce('FAKE_NONCE')
    .mockReturnValueOnce('FAKE_STATE');
  mockPost.mockRejectedValue(new Error('some network error'));
  renderMocked();
  await waitFor(() => {
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockLogin).not.toHaveBeenCalled();
  });
  // await waitFor(() => {
  //   expect(mockHistory.push).toHaveBeenCalledTimes(1);
  //   expect(mockHistory.push).toHaveBeenCalledWith('/');
  // });
});
