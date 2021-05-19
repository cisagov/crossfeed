import React from 'react';
import { render } from '@testing-library/react';
import { testUser, testOrganization, waitFor, fireEvent } from 'test-utils';
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
    maximumRole,
    touVersion,
    userMustSign,
    login
  } = useAuthContext();

  return (
    <div>
      <div data-testid="user">{JSON.stringify(user)}</div>
      <div data-testid="token">{token}</div>
      <div data-testid="org">{JSON.stringify(currentOrganization)}</div>
      <div data-testid="userMustSign">{userMustSign.toString()}</div>
      <div data-testid="maxRole">{maximumRole}</div>
      <div data-testid="touVersion">{touVersion}</div>
      <button data-testid="login" onClick={(e) => onLogin && onLogin(login)}>
        login
      </button>
      <button
        data-testid="setOrg"
        onClick={(e) => onSetOrg && onSetOrg(setOrganization)}
      >
        setOrg
      </button>
    </div>
  );
};

const TestComp: React.FC<Props> = (props) => (
  <AuthContextProvider>
    <InnerTestComp {...props} />
  </AuthContextProvider>
);

afterEach(() => {
  Object.values(mockedApi).forEach((fn) => fn.mockReset());
});

afterAll(() => {
  jest.restoreAllMocks();
});

const renderLoggedIn = async (user?: any, args?: Omit<Props, 'onLogin'>) => {
  const cb = (dispatch: React.Dispatch<any>) => dispatch('some-token');
  mockedApi.apiGet.mockResolvedValue(user ?? testUser);
  const { getByTestId, ...rest } = render(<TestComp onLogin={cb} {...args} />);
  fireEvent.click(getByTestId('login'));
  await waitFor(() => {
    expect(getByTestId('user')).toHaveTextContent(
      JSON.stringify(user ?? testUser)
    );
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
  const { getByTestId } = await renderLoggedIn(testUser, { onSetOrg: orgCb });
  expect(getByTestId('org')).toHaveTextContent(JSON.stringify(null));
  fireEvent.click(getByTestId('setOrg'));
  await waitFor(() => {
    expect(getByTestId('org')).toHaveTextContent(
      JSON.stringify({
        ...testOrganization
      })
    );
  });
});

it('sets user as max role for globalView userType', async () => {
  const { getByTestId } = await renderLoggedIn({
    ...testUser,
    userType: 'globalView'
  });
  expect(getByTestId('maxRole')).toHaveTextContent('user');
});

it('sets max role as admin when user has any admin role', async () => {
  const { getByTestId } = await renderLoggedIn({
    ...testUser,
    roles: [
      {
        role: 'admin',
        organization: {
          id: 'some-org-id'
        }
      }
    ]
  });
  expect(getByTestId('maxRole')).toHaveTextContent('admin');
});

it('sets touVersion based on max role and current terms', async () => {
  const { getByTestId } = await renderLoggedIn({
    ...testUser,
    userType: 'globalView'
  });
  expect(getByTestId('touVersion')).toHaveTextContent('v1-user');
});

it('CISA users do not have to sign terms', async () => {
  const { getByTestId } = await renderLoggedIn({
    ...testUser,
    email: 'anything@cisa.dhs.gov'
  });
  expect(getByTestId('userMustSign')).toHaveTextContent('false');
});

it('users have to sign if they have not accepted terms', async () => {
  const { getByTestId } = await renderLoggedIn({
    ...testUser,
    dateAcceptedTerms: null,
    email: 'anything@not_cisa_dhs.gov'
  });
  expect(getByTestId('userMustSign')).toHaveTextContent('true');
});

it('users have to sign if they have not signed newer terms', async () => {
  const { getByTestId } = await renderLoggedIn({
    ...testUser,
    dateAcceptedTerms: new Date(),
    email: 'anything@not_cisa_dhs.gov',
    acceptedTermsVersion: 'v0-user'
  });
  expect(getByTestId('userMustSign')).toHaveTextContent('true');
});
