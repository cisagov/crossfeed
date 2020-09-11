import { Organization } from 'types';
import { AuthUser, CurrentOrganization } from 'context';

const currentTermsVersion = '1';

export const getExtendedOrg = (org: Organization, user: AuthUser) => {
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

export const getMaximumRole = (user: AuthUser) => {
  if (user?.userType === 'globalView') return 'user';
  return user && user.roles && user.roles.find(role => role.role === 'admin')
    ? 'admin'
    : 'user';
};

export const getTouVersion = (maxRole: string) => {
  return `v${currentTermsVersion}-${maxRole}`;
};
