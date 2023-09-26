import { styled } from '@mui/material/styles';

const PREFIX = 'ImportExport';

export const importExportClasses = {
  formImport: `${PREFIX}-formImport`,
  formExport: `${PREFIX}-formExport`
};

export const FormRoot = styled('form')(({ theme }) => ({
  [`& .${importExportClasses.formExport}`]: {
    marginBottom: '6rem'
  }
}));
