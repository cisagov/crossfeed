import React, { useState } from 'react';
import { User } from 'types';
import * as authContextOrg from './authContextOrg';
import { Role, Organization as OrganizationType } from 'types';


const apiPost = authContextOrg.apiPost;
const setFeedbackMessage = authContextOrg.setFeedbackMessage;

const [userRoles, setUserRoles] = useState<Role[]>([]);
const [organization, setOrganization] = useState<OrganizationType>();
const [newUserValues, setNewUserValues] = useState<{
  firstName: string;
  lastName: string;
  email: string;
  organization?: OrganizationType;
  role: string;
}>({
  firstName: '',
  lastName: '',
  email: '',
  role: ''
});

export const approveUser = async (user: number) => {
    try {
      await apiPost(
        `/organizations/${organization?.id}/roles/${organization?.userRoles[user].id}/approve`,
        { body: {} }
      );
      const copy = userRoles.map((role, id) =>
        id === user ? { ...role, approved: true } : role
      );
      setUserRoles(copy);
    } catch (e) {
      console.error(e);
    }
  };

export const removeUser = async (user: number) => {
    try {
      await apiPost(
        `/organizations/${organization?.id}/roles/${userRoles[user].id}/remove`,
        { body: {} }
      );
      const copy = userRoles.filter((_, ind) => ind !== user);
      setUserRoles(copy);
    } catch (e) {
      console.error(e);
    }
  };

export const onInviteUserSubmit = async () => {
  try {
    const body = {
      firstName: newUserValues.firstName,
      lastName: newUserValues.lastName,
      email: newUserValues.email,
      organization: organization?.id,
      organizationAdmin: newUserValues.role === 'admin'
    };
    const user: User = await apiPost('/users/', {
      body
    });
    const newRole = user.roles[user.roles.length - 1];
    newRole.user = user;
    if (userRoles.find((role) => role.user.id === user.id)) {
      setUserRoles(
        userRoles.map((role) => (role.user.id === user.id ? newRole : role))
      );
    } else {
      setUserRoles(userRoles.concat([newRole]));
    }
  } catch (e: any) {
    setFeedbackMessage({
      message:
        e.status === 422 ? 'Error inviting user' : e.message ?? e.toString(),
      type: 'error'
    });
    console.log(e);
  }
};

export const onInviteUserTextChange: React.ChangeEventHandler<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
> = (e) => onInviteUserChange(e.target.name, e.target.value);

export const onInviteUserChange = (name: string, value: any) => {
  setNewUserValues((values) => ({
    ...values,
    [name]: value
  }));
};