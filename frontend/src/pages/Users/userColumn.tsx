import React, { useRef, useState } from 'react';
import { ModalRef } from '@trussworks/react-uswds';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { FaTimes } from 'react-icons/fa';
import { Column } from 'react-table';
import { User } from 'types';

const [selectedRow, setSelectedRow] = useState<number>(0);
const modalRef = useRef<ModalRef>(null);

export const columns: Column<User>[] = [
    {
    Header: 'Name',
    accessor: 'fullName',
    width: 200,
    disableFilters: true,
    id: 'name'
    },
    {
    Header: 'Email',
    accessor: 'email',
    width: 150,
    minWidth: 150,
    id: 'email',
    disableFilters: true
    },
    {
    Header: 'Organizations',
    accessor: ({ roles }) =>
        roles &&
        roles
        .filter((role) => role.approved)
        .map((role) => role.organization.name)
        .join(', '),
    id: 'organizations',
    width: 200,
    disableFilters: true,
    disableSortBy: true
    },
    {
    Header: 'User type',
    accessor: ({ userType }) =>
        userType === 'standard'
        ? 'Standard'
        : userType === 'globalView'
        ? 'Global View'
        : 'Global Admin',
    width: 50,
    minWidth: 50,
    id: 'userType',
    disableFilters: true
    },
    {
    Header: 'Date ToU Signed',
    accessor: ({ dateAcceptedTerms }) =>
        dateAcceptedTerms
        ? `${formatDistanceToNow(parseISO(dateAcceptedTerms))} ago`
        : 'None',
    width: 50,
    minWidth: 50,
    id: 'dateAcceptedTerms',
    disableFilters: true
    },
    {
    Header: 'ToU Version',
    accessor: 'acceptedTermsVersion',
    width: 50,
    minWidth: 50,
    id: 'acceptedTermsVersion',
    disableFilters: true
    },
    {
    Header: 'Last Logged In',
    accessor: ({ lastLoggedIn }) =>
        lastLoggedIn
        ? `${formatDistanceToNow(parseISO(lastLoggedIn))} ago`
        : 'None',
    width: 50,
    minWidth: 50,
    id: 'lastLoggedIn',
    disableFilters: true
    },
    {
    Header: 'Delete',
    id: 'delete',
    Cell: ({ row }: { row: { index: number } }) => (
        <span
        onClick={() => {
            modalRef.current?.toggleModal(undefined, true);
            setSelectedRow(row.index);
        }}
        >
        <FaTimes />
        </span>
    ),
    disableFilters: true
    }
];