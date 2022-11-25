import React from 'react';
import * as router from 'react-router-dom';
import { RouteGuard } from '../RouteGuard';
import { render, testUser } from 'test-utils';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn()
}));
const routerMock = jest.mocked(router);

const Protected: React.FC = () => <div>PROTECTED ROUTE</div>;

const mockPush = jest.fn();

beforeEach(() => {
  const mockHistory = {
    push: mockPush
  };
  routerMock.useHistory.mockReturnValue(
    mockHistory as unknown as ReturnType<typeof router.useHistory>
  );
});

afterEach(() => {
  mockPush.mockReset();
});

afterAll(() => {
  jest.restoreAllMocks();
});

it('renders protected route for authenticated user', () => {
  const { getByText } = render(<RouteGuard component={Protected} />, {
    authContext: {
      user: testUser,
      token: 'some-token'
    }
  });
  expect(getByText('PROTECTED ROUTE')).toBeInTheDocument();
});

it('returns null while loading user profile', () => {
  const { asFragment } = render(<RouteGuard component={Protected} />, {
    authContext: {
      user: null,
      token: 'some-token'
    }
  });
  expect(asFragment()).toMatchInlineSnapshot(`<DocumentFragment />`);
});

it('redirects to /create-account if user is not fully registered', () => {
  render(<RouteGuard component={Protected} />, {
    authContext: {
      user: { ...testUser, isRegistered: false },
      token: 'some-token'
    }
  });
  expect(mockPush).toHaveBeenCalled();
  expect(mockPush.mock.calls[0][0]).toEqual('/create-account');
});

it('redirects to /terms if user must sign terms', () => {
  render(<RouteGuard component={Protected} />, {
    authContext: {
      user: testUser,
      token: 'some-token',
      userMustSign: true
    }
  });
  expect(mockPush).toHaveBeenCalledTimes(1);
  expect(mockPush.mock.calls[0][0]).toEqual('/terms');
});

it('redirects to unauth if user is not authenticated and unauth is string', () => {
  render(<RouteGuard component={Protected} unauth="/not-auth" />, {
    authContext: {
      user: null,
      token: null
    }
  });
  expect(mockPush).toHaveBeenCalledTimes(1);
  expect(mockPush.mock.calls[0][0]).toEqual('/not-auth');
});

it('renders unauth component if user not authenticated and unauth is component', () => {
  const UnAuth: React.FC = () => <div>UNAUTH ROUTE</div>;
  const { getByText, queryByText } = render(
    <RouteGuard component={Protected} unauth={UnAuth} />,
    {
      authContext: {
        user: null,
        token: null
      }
    }
  );
  expect(queryByText('PROTECTED ROUTE')).not.toBeInTheDocument();
  expect(getByText('UNAUTH ROUTE')).toBeInTheDocument();
});
