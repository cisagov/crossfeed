import React from 'react';
import { render } from '@testing-library/react';
import { testUser, testOrganization, wait, fireEvent } from 'test-utils';
import { useAuthContext } from '../AuthContext';
import { AuthContextProvider } from 'context/AuthContextProvider';

const mockedApi = {
  apiGet: jest.fn()
};
jest.mock('hooks/useApi', () => ({
  useApi: () => mockedApi
}));

interface Props {
  onLogin?(dispatch: React.Dispatch<any>): void;
  onSetOrg?(dispatch: React.Dispatch<any>): void;
}

const InnerTestComp: React.FC<Props> = ({ onLogin, onSetOrg }) => {
  const {
    token,
    user,
    setOrganization,
    currentOrganization,
    login
  } = useAuthContext();

  return (
    <div>
      <div data-testid="user">{JSON.stringify(user)}</div>
      <div data-testid="token">{token}</div>
      <div data-testid="org">{JSON.stringify(currentOrganization)}</div>
      <button data-testid="login" onClick={e => onLogin && onLogin(login)}>
        login
      </button>
      <button
        data-testid="setOrg"
        onClick={e => onSetOrg && onSetOrg(setOrganization)}
      >
        setOrg
      </button>
    </div>
  );
};

const TestComp: React.FC<Props> = props => (
  <AuthContextProvider>
    <InnerTestComp {...props} />
  </AuthContextProvider>
);

afterEach(() => {
  Object.values(mockedApi).forEach(fn => fn.mockReset());
});

afterAll(() => {
  jest.restoreAllMocks();
});

const renderLoggedIn = async (args?: Omit<Props, 'onLogin'>) => {
  const { isRegistered, ...user } = testUser;
  const cb = (dispatch: React.Dispatch<any>) => dispatch('some-token');
  mockedApi.apiGet.mockResolvedValue(user);
  const { getByTestId, ...rest } = render(<TestComp onLogin={cb} {...args} />);
  fireEvent.click(getByTestId('login'));
  await wait(() => {
    expect(getByTestId('user')).toHaveTextContent(JSON.stringify(testUser));
  });
  return { getByTestId, ...rest };
};

it('user is null by default', () => {
  const { getByTestId } = render(<TestComp />);
  expect(getByTestId('user')).toHaveTextContent(JSON.stringify(null));
});

it('fetches user profile when logged in', async () => {
  const { getByTestId } = await renderLoggedIn();
  expect(getByTestId('user')).toHaveTextContent(JSON.stringify(testUser));
});

it('parses extendedOrg for provided organization', async () => {
  const orgCb = (dispatch: React.Dispatch<any>) => dispatch(testOrganization);
  const { getByTestId } = await renderLoggedIn({ onSetOrg: orgCb });
  expect(getByTestId('org')).toHaveTextContent(JSON.stringify(null));
  fireEvent.click(getByTestId('setOrg'));
  await wait(() => {
    expect(getByTestId('org')).toHaveTextContent(
      JSON.stringify({
        ...testOrganization,
        userIsAdmin: false
      })
    );
  });
});
