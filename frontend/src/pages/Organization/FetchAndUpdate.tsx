import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthContext } from 'context';
import { 
  Organization as OrganizationType,
  OrganizationTag,
  Scan,
  ScanSchema,
  ScanTask,
  Role 
} from 'types';


interface AutocompleteType extends Partial<OrganizationType> {
  title?: string;
}

const { apiGet, apiPut, user, setFeedbackMessage } = useAuthContext();
const organizationId  = useParams<{ organizationId: string }>();
const [organization, setOrganization] = useState<OrganizationType>();
const [tags, setTags] = useState<AutocompleteType[]>([]);
const [userRoles, setUserRoles] = useState<Role[]>([]);
const [scans, setScans] = useState<Scan[]>([]);
const [scanTasks, setScanTasks] = useState<ScanTask[]>([]);
const [scanSchema, setScanSchema] = useState<ScanSchema>({});


export const fetchOrganization = useCallback(async () => {
    try {
      const organization = await apiGet<OrganizationType>(
        `/organizations/${organizationId}`
      );
      organization.scanTasks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrganization(organization);
      setUserRoles(organization.userRoles);
      setScanTasks(organization.scanTasks);
      const tags = await apiGet<OrganizationTag[]>(`/organizations/tags`);
      setTags(tags);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet, setOrganization, organizationId]);

export const fetchScans = useCallback(async () => {
    try {
      const response = await apiGet<{
        scans: Scan[];
        schema: ScanSchema;
      }>('/granularScans/');
      let { scans } = response;
      const { schema } = response;

      if (user?.userType !== 'globalAdmin')
        scans = scans.filter(
          (scan) =>
            scan.name !== 'censysIpv4' && scan.name !== 'censysCertificates'
        );

      setScans(scans);
      setScanSchema(schema);
    } catch (e) {
      console.error(e);
    }
  }, [apiGet, user]);

  
export const updateOrganization = async (body: any) => {
    try {
      const org = await apiPut('/organizations/' + organization?.id, {
        body: organization
      });
      setOrganization(org);
      setFeedbackMessage({
        message: 'Organization successfully updated',
        type: 'success'
      });
    } catch (e: any) {
      setFeedbackMessage({
        message:
          e.status === 422
            ? 'Error updating organization'
            : e.message ?? e.toString(),
        type: 'error'
      });
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);
