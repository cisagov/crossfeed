import React from 'react';
import { render, fireEvent, testUser, testOrganization } from 'test-utils';
import { Header } from '../Header';
import { wait, getByTestId } from '@testing-library/react';

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
    await wait(() => {
      expect(getByTestId('mobilenav')).toBeInTheDocument();
    });
  });

  it('shows no links for unauthenticated user', () => {
    const { queryByText } = render(<Header />, {
      authContext: {
        user: { ...testUser, userType: 'standard', isRegistered: false },
        currentOrganization: { ...testOrganization, userIsAdmin: false }
      }
    });
    [
      'Vulnerabilities',
      'Risk Summary',
      'My Organizations',
      'Manage Organizations',
      'Scans',
      'Manage Users',
      'My Account'
    ].forEach(expected => {
      expect(queryByText(expected)).not.toBeInTheDocument();
    });
  });

  it('shows correct links for ORG_USER', () => {
    const { getByText, queryByText } = render(<Header />, {
      authContext: {
        user: { ...testUser, userType: 'standard', isRegistered: true },
        currentOrganization: { ...testOrganization, userIsAdmin: false }
      }
    });
    [
      'Vulnerabilities',
      'Risk Summary',
      'My Organizations',
      'My Account'
    ].forEach(expected => {
      expect(getByText(expected)).toBeInTheDocument();
    });
    ['Manage Organizations', 'Scans', 'Manage Users'].forEach(notExpected => {
      expect(queryByText(notExpected)).not.toBeInTheDocument();
    });
  });

  it('shows correct links for ORG_ADMIN', () => {
    const { getByText, queryByText } = render(<Header />, {
      authContext: {
        user: { ...testUser, userType: 'standard', isRegistered: true },
        currentOrganization: { ...testOrganization, userIsAdmin: true }
      }
    });
    [
      'Vulnerabilities',
      'Risk Summary',
      'Organization Settings',
      'My Organizations',
      'My Account'
    ].forEach(expected => {
      expect(getByText(expected)).toBeInTheDocument();
    });
    ['Manage Organizations', 'Manage Users'].forEach(notExpected => {
      expect(queryByText(notExpected)).not.toBeInTheDocument();
    });
  });

  it('shows correct links for GLOBAL_ADMIN', () => {
    const { getByText, queryByText } = render(<Header />, {
      authContext: {
        user: { ...testUser, userType: 'globalAdmin', isRegistered: true },
        currentOrganization: { ...testOrganization, userIsAdmin: true }
      }
    });
    [
      'Vulnerabilities',
      'Risk Summary',
      'Organization Settings',
      'Scans',
      'Manage Organizations',
      'Manage Users',
      'My Account'
    ].forEach(expected => {
      expect(getByText(expected)).toBeInTheDocument();
    });
    ['My Organizations'].forEach(notExpected => {
      expect(queryByText(notExpected)).not.toBeInTheDocument();
    });
  });
});
