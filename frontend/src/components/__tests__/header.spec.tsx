import React from 'react';
import { render, fireEvent, testUser, testOrganization } from 'test-utils';
import { Header } from '../Header';
import { waitFor } from '@testing-library/react';

jest.mock('@elastic/react-search-ui', () => ({
  withSearch: () => (comp: any) => comp
}));

describe('Header component', () => {
  it('matches snapshot', () => {
    const { asFragment } = render(<Header />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('can expand drawer', async () => {
    const { getByLabelText, getByTestId, queryByTestId } = render(<Header />);
    expect(queryByTestId('mobilenav')).not.toBeInTheDocument();
    expect(getByLabelText('toggle mobile menu')).toBeInTheDocument();
    fireEvent.click(getByLabelText('toggle mobile menu'));
    await waitFor(() => {
      expect(getByTestId('mobilenav')).toBeInTheDocument();
    });
  });

  it('shows no links for unauthenticated user', () => {
    const { queryByText } = render(<Header />, {
      authContext: {
        user: { ...testUser, userType: 'standard', isRegistered: false },
        currentOrganization: { ...testOrganization }
      }
    });
    [
      'Vulnerabilities',
      'Risk Summary',
      // 'My Organizations',
      'Manage Organizations',
      'Scans',
      'Manage Users',
      'My Account'
    ].forEach((expected) => {
      expect(queryByText(expected)).not.toBeInTheDocument();
    });
  });

  it('shows correct links for ORG_USER', () => {
    const { getByText, queryByText } = render(<Header />, {
      authContext: {
        user: { ...testUser, userType: 'standard', isRegistered: true },
        currentOrganization: { ...testOrganization }
      }
    });
    [
      'Overview',
      'Inventory',
      // 'My Organizations',
      'My Account',
      'My Settings',
      'Logout'
    ].forEach((expected) => {
      expect(getByText(expected)).toBeInTheDocument();
    });
    ['Manage Organizations', 'Scans', 'Manage Users'].forEach((notExpected) => {
      expect(queryByText(notExpected)).not.toBeInTheDocument();
    });
  });

  it('shows correct links for ORG_ADMIN', () => {
    const { getByText, queryByText } = render(<Header />, {
      authContext: {
        user: { ...testUser, userType: 'standard', isRegistered: true },
        currentOrganization: { ...testOrganization }
      }
    });
    [
      'Overview',
      'Inventory',
      // 'My Organizations',
      'My Account',
      'My Settings',
      'Logout'
    ].forEach((expected) => {
      expect(getByText(expected)).toBeInTheDocument();
    });
    ['Manage Organizations', 'Manage Users'].forEach((notExpected) => {
      expect(queryByText(notExpected)).not.toBeInTheDocument();
    });
  });

  it('shows correct links for GLOBAL_ADMIN', () => {
    const { getByText } = render(<Header />, {
      authContext: {
        user: { ...testUser, userType: 'globalAdmin', isRegistered: true },
        currentOrganization: { ...testOrganization }
      }
    });
    [
      'Overview',
      'Inventory',
      'Scans',
      'Manage Organizations',
      'Manage Users',
      'My Account',
      'My Settings',
      'Logout'
    ].forEach((expected) => {
      expect(getByText(expected)).toBeInTheDocument();
    });
    // ['My Organizations'].forEach((notExpected) => {
    //   expect(queryByText(notExpected)).not.toBeInTheDocument();
    // });
  });
});
