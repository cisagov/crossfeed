import React from 'react';
import { Button, Label, FormGroup } from '@trussworks/react-uswds';
import { FileInput } from 'components';
import { useAuthContext } from 'context';
import Papa from 'papaparse';
import * as FileSaver from 'file-saver';

export const ImportExport = <T extends object>(props: {
  // Plural name of the model.
  name: string;

  // List of fields to export.
  fieldsToExport: string[];

  // Callback that handles data on import (usually saves the data).
  onImport: (e: T[]) => void;

  // Return data to be exported.
  getDataToExport: () => T[] | Promise<T[]>;
}) => {
  const { setLoading } = useAuthContext();
  const { name, fieldsToExport, onImport, getDataToExport } = props;

  const downloadCSV = async (filename: string) => {
    const csv = Papa.unparse({
      fields: fieldsToExport,
      data: await getDataToExport()
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    FileSaver.saveAs(blob, `${filename}.csv`);
  };

  const parseCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files.length) {
      return;
    }
    setLoading(l => l + 1);
    const results: T[] = await new Promise((resolve, reject) =>
      Papa.parse(event.target.files![0], {
        header: true,
        dynamicTyping: true,
        complete: ({ data, errors }) =>
          errors.length ? reject(errors) : resolve(data as T[])
      })
    );
    setLoading(l => l - 1);
    onImport(results);
  };

  return (
    <form>
      <h2>Import {name}</h2>
      <FormGroup>
        <Label htmlFor="import">
          File must be in a CSV format, with the same header as the exported
          file.
        </Label>
        <FileInput id="import" accept=".csv" onChange={e => parseCSV(e)} />
      </FormGroup>
      <h2>Export {name}</h2>
      <Button
        type="button"
        outline
        onClick={() => downloadCSV(`${name}-${new Date().toISOString()}`)}
      >
        Export as CSV
      </Button>
    </form>
  );
};
