import { styled } from '@mui/material/styles';

const PREFIX = 'FilterTags';

export const classes = {
  chip: `${PREFIX}-chip`
};

export const Root = styled('div')(({ theme }) => ({
  [`& .${classes.chip}`]: {
    margin: '0 0.5rem'
  }
}));
