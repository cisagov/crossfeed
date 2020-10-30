import React from 'react';
import { Button, Label, FormGroup } from '@trussworks/react-uswds';
import { FileInput } from 'components';
import { useAuthContext } from 'context';
import Papa from 'papaparse';
import * as FileSaver from 'file-saver';

interface ImportProps<T> {
  // Plural name of the model.
  name: string;

  // Callback that handles data on import (usually saves the data).
  onImport: (e: T[]) => void;
}

interface ExportProps<T> {
  // Plural name of the model.
  name: string;

  // List of fields to export.
  fieldsToExport?: string[];

  // Return data to be exported.
  getDataToExport: () => Partial<T>[] | Promise<Partial<T>[]> | Promise<string>;
}

interface ImportExportProps<T> extends ImportProps<T>, ExportProps<T> {}

export const Import = <T extends object>(props: ImportProps<T>) => {
  const { setLoading } = useAuthContext();
  const { name, onImport } = props;
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
    </form>
  );
};

export const Export = <T extends object>(props: ExportProps<T>) => {
  const { setLoading } = useAuthContext();
  const { name, fieldsToExport = [], getDataToExport } = props;

  const downloadCSV = async (filename: string) => {
    setLoading(l => l + 1);
    const data = await getDataToExport();
    if (typeof data === "string") {
      setLoading(l => l - 1);
      window.open(data);
      return;
    }
    const csv = Papa.unparse({
      fields: fieldsToExport,
      data: data
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    FileSaver.saveAs(blob, `${filename}.csv`);
    setLoading(l => l - 1);
  };

  return (
    <form>
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

export const ImportExport = <T extends object>(props: ImportExportProps<T>) => {
  const { name, onImport, getDataToExport, fieldsToExport } = props;
  return (
    <>
      <Import name={name} onImport={onImport} />
      <Export
        name={name}
        fieldsToExport={fieldsToExport}
        getDataToExport={getDataToExport}
      />
    </>
  );
};
