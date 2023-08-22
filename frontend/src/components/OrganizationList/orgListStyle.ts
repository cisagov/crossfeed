import { styled } from '@mui/material/styles';

const PREFIX = 'OrganizationList';

export const classes = {
  cardRoot: `${PREFIX}-cardRoot`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
export const Root = styled('div')(({ theme }) => ({
  [`& .${classes.cardRoot}`]: {
    cursor: 'pointer',
    boxSizing: 'border-box',
    border: '2px solid #DCDEE0',
    height: 150,
    width: 200,
    borderRadius: '5px',
    padding: '1rem',
    color: '#3D4551',
    '& h1': {
      fontSize: '20px',
      margin: 0
    },
    '& p': {
      fontSize: '14px'
    }
  }
}));
