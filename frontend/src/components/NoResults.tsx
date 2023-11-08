import React from 'react';
import { styled } from '@mui/material/styles';
import { Paper } from '@mui/material';
import logo from '../assets/crossfeed_blue.svg';

const PREFIX = 'NoResults';

const classes = {
  card: `${PREFIX}-card`,
  logo: `${PREFIX}-logo`
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  [`&.${classes.card}`]: {
    marginTop: '10px',
    boxSizing: 'border-box',
    marginBottom: '1rem',
    border: '1px solid #DCDEE0',
    height: '400px',
    width: '500px',
    display: 'flex',
    borderRadius: '5px',
    margin: '0 auto',
    justifyContent: 'center',
    alignContent: 'center',
    flexDirection: 'column',
    '& p': {
      textAlign: 'center',
      lineHeight: 1.5,
      color: theme.palette.primary.main,
      fontSize: '18px',
      width: '70%',
      margin: '0 auto'
    },
    padding: '1rem'
  },

  [`& .${classes.logo}`]: {
    width: '100px',
    marginBottom: 25,
    margin: '0 auto'
  }
}));

interface Props {
  message: string;
}

export const NoResults: React.FC<Props> = (props) => {
  return (
    <StyledPaper className={classes.card}>
      <img src={logo} className={classes.logo} alt="Crossfeed Icon" />
      <p>{props.message}</p>
    </StyledPaper>
  );
};
