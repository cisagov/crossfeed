import React from 'react';
import { TermsOfUse } from '../TermsOfUse';
import { render, fireEvent, waitFor } from 'test-utils';

// jest.mock('react-router-dom', () => ({
//   ...jest.requireActual('react-router-dom'),
//   useHistory: jest.fn()
// }));
// const mockedRouter = jest.mocked(router);

// const mockHistory = {
//   push: jest.fn()
// };

beforeAll(() => {
  // mockedRouter.useHistory.mockReturnValue(
  //   (mockHistory as unknown) as ReturnType<typeof router.useHistory>
  // );
});

beforeEach(() => {
  // mockHistory.push.mockReset();
});

afterAll(() => {
  jest.restoreAllMocks();
});

const adminOnly = [
  /By creating a Crossfeed\s*administrator\s*account/,
  /You have authority to authorize scanning\/evaluation/,
  /You are authorized to make the above certifications on your organization’s behalf/
];

it('matches admin snapshot', () => {
  const { asFragment } = render(<TermsOfUse />, {
    authContext: {
      maximumRole: 'admin',
      touVersion: 'v5-admin'
    }
  });
  expect(asFragment()).toMatchSnapshot();
});

it('matches user snapshot', () => {
  const { asFragment } = render(<TermsOfUse />, {
    authContext: {
      maximumRole: 'user',
      touVersion: 'v5-user'
    }
  });
  expect(asFragment()).toMatchSnapshot();
});

it('renders additional info for administrators', () => {
  const { getByText } = render(<TermsOfUse />, {
    authContext: {
      maximumRole: 'admin',
      touVersion: 'v5-admin'
    }
  });
  expect(getByText('ToU version v5-admin')).toBeInTheDocument();
  adminOnly.forEach((copy) => {
    expect(getByText(copy)).toBeInTheDocument();
  });
});

it('renders less info for non-administrators', () => {
  const { getByText, queryByText } = render(<TermsOfUse />, {
    authContext: {
      maximumRole: 'user',
      touVersion: 'v5-user'
    }
  });
  expect(getByText('ToU version v5-user')).toBeInTheDocument();
  adminOnly.forEach((copy) => {
    expect(queryByText(copy)).not.toBeInTheDocument();
  });
});

it('terms must be accepted before submitting', async () => {
  const { getByText, queryByText } = render(<TermsOfUse />);
  expect(queryByText('Must accept terms')).not.toBeInTheDocument();
  fireEvent.click(getByText('Submit'));
  await waitFor(() => {
    expect(queryByText('Must accept terms')).toBeInTheDocument();
  });
});

it('handles valid terms submission correctly', async () => {
  // mockHistory.push.mockReturnValue(undefined);
  const mockPost = jest.fn();
  const mockSetUser = jest.fn();
  mockPost.mockReturnValue({ user: 'some new user info' });
  const { getByLabelText, getByText } = render(<TermsOfUse />, {
    authContext: {
      apiPost: mockPost,
      setUser: mockSetUser,
      touVersion: 'v5-user'
    }
  });
  const checkbox = getByLabelText('I accept the above Terms and Conditions.');
  expect(checkbox).not.toBeChecked();
  fireEvent.click(checkbox);
  await waitFor(() => {
    expect(checkbox).toBeChecked();
  });
  fireEvent.click(getByText('Submit'));
  await waitFor(() => {
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][0]).toEqual('/users/me/acceptTerms');
    expect(mockPost.mock.calls[0][1]).toMatchObject({
      body: { version: 'v5-user' }
    });
  });
  await waitFor(() => {
    expect(mockSetUser).toHaveBeenCalledTimes(1);
    expect(mockSetUser.mock.calls[0][0]).toMatchObject({
      user: 'some new user info'
    });
  });
  // await waitFor(() => {
  //   expect(mockHistory.push).toHaveBeenCalledTimes(1);
  //   expect(mockHistory.push.mock.calls[0][0]).toEqual('/');
  //   expect(mockHistory.push.mock.calls[0][1]).toMatchObject({
  //     message: 'Your account has been successfully created.'
  //   });
  // });
});
