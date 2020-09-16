import { Organization } from 'types';
import { AuthUser, CurrentOrganization } from './AuthContext';

const currentTermsVersion = process.env.REACT_APP_TERMS_VERSION;

export const getExtendedOrg = (
  org: Organization | null,
  user: AuthUser | null
) => {
  let current: CurrentOrganization | null =
    org ?? user?.roles[0]?.organization ?? null;
  if (!current) {
    return null;
  }
  current.userIsAdmin =
    user?.userType === 'globalAdmin' ||
    user?.roles.find(role => role.organization.id === org?.id)?.role ===
      'admin';
  return current;
};

export const getMaximumRole = (user: AuthUser | null) => {
  if (user?.userType === 'globalView') return 'user';
  return user && user.roles && user.roles.find(role => role.role === 'admin')
    ? 'admin'
    : 'user';
};

export const getTouVersion = (maxRole: string) => {
  return `v${currentTermsVersion}-${maxRole}`;
};

export const getUserMustSign = (user: AuthUser | null, touVersion: string) => {
  const approvedEmailAddresses = ['@cisa.dhs.gov'];
  for (let email of approvedEmailAddresses) {
    if (user?.email.endsWith(email)) return false;
  }
  return Boolean(
    !user?.dateAcceptedTerms ||
      (user.acceptedTermsVersion && user.acceptedTermsVersion !== touVersion)
  );
};
