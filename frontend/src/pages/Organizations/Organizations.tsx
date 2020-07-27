import classes from './Organizations.module.scss';
import React, { useCallback, useState } from 'react';
import {
  Button,
  ModalContainer,
  Overlay,
  Modal
} from '@trussworks/react-uswds';
import { Query } from 'types';
import { Table } from 'components';
import { Column } from 'react-table';
import { Organization } from 'types';
import { FaTimes } from 'react-icons/fa';
import { useAuthContext } from 'context';
import { OrganizationForm } from 'components/OrganizationForm';
import { useHistory } from 'react-router-dom';

interface Errors extends Partial<Organization> {
  global?: string;
}

export const Organizations: React.FC = () => {
  const {
    currentOrganization,
    user,
    setOrganization,
    apiGet,
    apiPost,
    apiDelete
  } = useAuthContext();
  const [showModal, setShowModal] = useState<Boolean>(false);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const history = useHistory();

  const columns: Column<Organization>[] = [
    {
      Header: 'Name',
      accessor: 'name',
      width: 200,
      disableFilters: true,
      id: 'name'
    },
    {
      Header: 'Root Domains',
      accessor: ({ rootDomains }) => rootDomains.join(', '),
      width: 150,
      minWidth: 150,
      id: 'rootDomains',
      disableFilters: true
    },
    {
      Header: 'IP Blocks',
      accessor: ({ ipBlocks }) => ipBlocks.join(', '),
      id: 'ipBlocks',
      width: 200,
      disableFilters: true
    },
    {
      Header: 'Passive',
      accessor: ({ isPassive }) => (isPassive ? 'Yes' : 'No'),
      id: 'isPassive',
      width: 50,
      disableFilters: true
    },
    {
      Header: 'Invite Only',
      accessor: ({ inviteOnly }) => (inviteOnly ? 'Yes' : 'No'),
      id: 'inviteOnly',
      width: 50,
      disableFilters: true
    },
    {
      Header: 'Make Current',
      id: 'makeCurrent',
      Cell: ({ row }: { row: { index: number } }) =>
        currentOrganization &&
        currentOrganization.id === organizations[row.index].id ? (
          <p>Current</p>
        ) : (
          <a
            style={{ color: 'black' }}
            href="# "
            onClick={() => {
              setOrganization(organizations[row.index]);
              if (currentOrganization?.userIsAdmin) {
                history.push('/organization');
              } else {
                history.push('/');
              }
            }}
          >
            Make Current
          </a>
        ),
      width: 50,
      disableFilters: true
    },
    {
      Header: 'Delete',
      id: 'delete',
      Cell: ({ row }: { row: { index: number } }) => (
        <span
          onClick={() => {
            setShowModal(true);
            setSelectedRow(row.index);
          }}
        >
          <FaTimes className="margin-x-auto display-block" />
        </span>
      ),
      width: 50,
      disableFilters: true
    }
  ];
  const [errors, setErrors] = useState<Errors>({});

  const fetchOrganizations = useCallback(
    async (query: Query<Organization>) => {
      try {
        let rows = await apiGet<Organization[]>('/organizations/');
        setOrganizations(rows);
      } catch (e) {
        console.error(e);
      }
    },
    [apiGet]
  );

  const deleteRow = async (index: number) => {
    try {
      let row = organizations[index];
      await apiDelete(`/organizations/${row.id}`);
      setOrganizations(
        organizations.filter(organization => organization.id !== row.id)
      );
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? 'Unable to delete organization'
            : e.message ?? e.toString()
      });
      console.log(e);
    }
  };

  const onSubmit = async (body: Object) => {
    try {
      const org = await apiPost('/organizations/', {
        body
      });
      setOrganizations(organizations.concat(org));
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? 'Error when submitting organization entry.'
            : e.message ?? e.toString()
      });
      console.error(e);
    }
  };

  React.useEffect(() => {
    document.addEventListener('keyup', e => {
      //Escape
      if (e.keyCode === 27) {
        setShowModal(false);
      }
    });
  }, [apiGet]);

  return (
    <div className={classes.root}>
      <h1>Organizations</h1>
      <Table<Organization>
        columns={columns}
        data={organizations}
        fetchData={fetchOrganizations}
      />
      {user?.userType === 'globalAdmin' && (
        <>
          <h2>Add an organization</h2>
          {errors.global && <p className={classes.error}>{errors.global}</p>}
          <OrganizationForm
            onSubmit={onSubmit}
            type="create"
          ></OrganizationForm>
        </>
      )}
      {showModal && (
        <div>
          <Overlay />
          <ModalContainer>
            <Modal
              actions={
                <>
                  <Button
                    outline
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      deleteRow(selectedRow);
                      setShowModal(false);
                    }}
                  >
                    Delete
                  </Button>
                </>
              }
              title={<h2>Delete organization?</h2>}
            >
              <p>
                Are you sure you would like to delete the{' '}
                <code>{organizations[selectedRow].name}</code> organization?
                This will irreversibly delete all associated domains.
              </p>
            </Modal>
          </ModalContainer>
        </div>
      )}
    </div>
  );
};

export default Organizations;
