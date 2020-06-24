import classes from "./Organizations.module.scss";
import React, { useCallback, useState } from "react";
import {
  Button,
  TextInput,
  Label,
  Dropdown,
  ModalContainer,
  Overlay,
  Modal,
} from "@trussworks/react-uswds";
import { Query } from "types";
import { Table } from "components";
import { Column } from "react-table";
import { Organization } from "types";
import { FaTimes } from "react-icons/fa";
import { useAuthContext } from "context";

interface Errors extends Partial<Organization> {
  global?: string;
}

export const Organizations: React.FC = () => {
  const { apiGet, apiPost, apiDelete } = useAuthContext();
  const [showModal, setShowModal] = useState<Boolean>(false);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const columns: Column<Organization>[] = [
    {
      Header: "Name",
      accessor: "name",
      width: 200,
      disableFilters: true,
      id: "name",
    },
    {
      Header: "Root Domains",
      accessor: (args: Organization) => JSON.stringify(args.rootDomains),
      width: 150,
      minWidth: 150,
      id: "rootDomains",
      disableFilters: true,
    },
    {
      Header: "IP Blocks",
      accessor: "ipBlocks",
      id: "ipBlocks",
      width: 200,
      disableFilters: true,
    },
    {
      Header: "Delete",
      id: "delete",
      Cell: ({ row }: { row: { index: number } }) => (
        <span
          onClick={() => {
            setShowModal(true);
            setSelectedRow(row.index);
          }}
        >
          <FaTimes />
        </span>
      ),
      disableFilters: true,
    },
  ];
  const [errors, setErrors] = useState<Errors>({});

  const [values, setValues] = useState<Organization>({
    id: 0,
    name: "CISA",
    rootDomains: ["cisa.gov"],
    ipBlocks: ["127.0.0.0/24"],
  });

  const fetchOrganizations = useCallback(
    async (query: Query<Organization>) => {
      try {
        let rows = await apiGet<Organization[]>("/api/organizations/");
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
      await apiDelete(`/api/organizations/${row.id}`);
      setOrganizations(
        organizations.filter((organization) => organization.id !== row.id)
      );
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? "Unable to delete organization"
            : e.message ?? e.toString(),
      });
      console.log(e);
    }
  };

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      await apiPost("/api/organizations/", {
        body: JSON.stringify(values),
      });
      setOrganizations(organizations.concat(values));
    } catch (e) {
      setErrors({
        global:
          e.status === 422
            ? "Error when submitting organization entry."
            : e.message ?? e.toString(),
      });
      console.log(e);
    }
  };

  const onChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement
  > = (e) => {
    e.persist();
    setValues((values) => ({
      ...values,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className={classes.root}>
      <h1>Organizations</h1>
      <Table<Organization>
        columns={columns}
        data={organizations}
        fetchData={fetchOrganizations}
      />
      <h2>Add an organization</h2>
      <form onSubmit={onSubmit} className={classes.form}>
        {errors.global && <p className={classes.error}>{errors.global}</p>}
        <Label htmlFor="name">Name</Label>
        <TextInput
          required
          id="name"
          name="name"
          className={classes.textField}
          type="text"
          onChange={onChange}
        />
        <Label htmlFor="rootDomains">Root Domains</Label>
        <TextInput
          required
          id="rootDomains"
          name="rootDomains"
          className={classes.textField}
          type="text"
          onChange={onChange}
        />
        <Label htmlFor="ipBlocks">IP Blocks (Optional)</Label>
        <TextInput
          id="ipBlocks"
          name="ipBlocks"
          className={classes.textField}
          type="text"
          onChange={onChange}
        />
        <br></br>
        <Button type="submit">Create Organization</Button>
      </form>

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
                Are you sure you would like to delete the{" "}
                <code>{organizations[selectedRow].name}</code> organization?
              </p>
            </Modal>
          </ModalContainer>
        </div>
      )}
    </div>
  );
};

export default Organizations;
