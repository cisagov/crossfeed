import React, { useState } from 'react';
import { useAuthContext } from 'context';
import { 
    PendingDomain,
    Organization as OrganizationType
} from 'types';


const { apiPost, user, setFeedbackMessage } = useAuthContext();
// const organizationId  = useParams<{ organizationId: string }>();
const [organization, setOrganization] = useState<OrganizationType>();
// const [tags, setTags] = useState<AutocompleteType[]>([]);
// const [userRoles, setUserRoles] = useState<Role[]>([]);
// const [scans, setScans] = useState<Scan[]>([]);
// const [scanTasks, setScanTasks] = useState<ScanTask[]>([]);
// const [scanSchema, setScanSchema] = useState<ScanSchema>({});
// const [newUserValues, setNewUserValues] = useState<{
//   firstName: string;
//   lastName: string;
//   email: string;
//   organization?: OrganizationType;
//   role: string;
// }>({
//   firstName: '',
//   lastName: '',
//   email: '',
//   role: ''
// });

// const [tagValue, setTagValue] = React.useState<AutocompleteType | null>(null);
const [inputValue, setInputValue] = React.useState('');
const [dialog, setDialog] = React.useState<{
  open: boolean;
  type?: 'rootDomains' | 'ipBlocks' | 'tags';
  label?: string;
  stage?: number;
  domainVerificationStatusMessage?: string;
}>({ open: false });


interface AutocompleteType extends Partial<OrganizationType> {
  title?: string;
}

export const initiateDomainVerification = async (domain: string) => {
    try {
      if (!organization) return;
      const pendingDomains: PendingDomain[] = await apiPost(
        `/organizations/${organization?.id}/initiateDomainVerification`,
        {
          body: { domain }
        }
      );
      setOrganization({ ...organization, pendingDomains });
    } catch (e: any) {
      setFeedbackMessage({
        message:
          e.status === 422
            ? 'Error creating domain'
            : e.message ?? e.toString(),
        type: 'error'
      });
      console.error(e);
    }
  };

export const checkDomainVerification = async (domain: string) => {
    try {
      if (!organization) return;
      const resp: { success: boolean; organization?: OrganizationType } =
        await apiPost(
          `/organizations/${organization?.id}/checkDomainVerification`,
          {
            body: { domain }
          }
        );
      if (resp.success && resp.organization) {
        setOrganization(resp.organization);
        setDialog({ open: false });
        setFeedbackMessage({
          message: 'Domain ' + inputValue + ' successfully verified!',
          type: 'success'
        });
      } else {
        setDialog({
          ...dialog,
          domainVerificationStatusMessage:
            'Record not yet found. Note that DNS records may take up to 72 hours to propagate. You can come back later to check the verification status.'
        });
      }
    } catch (e: any) {
      setFeedbackMessage({
        message:
          e.status === 422
            ? 'Error verifying domain'
            : e.message ?? e.toString(),
        type: 'error'
      });
      console.error(e);
    }
  };
