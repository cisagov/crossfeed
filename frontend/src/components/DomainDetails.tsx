import React, { useCallback, useEffect, useState } from 'react';
import { Paper, makeStyles } from '@material-ui/core';
import { Domain } from 'types';
import { useDomainApi } from 'hooks';

interface Props {
  domainId: string;
}

export const DomainDetails: React.FC<Props> = (props) => {
  const { domainId } = props;
  const { getDomain } = useDomainApi(false);
  const [domain, setDomain] = useState<Domain>();
  const classes = useStyles();

  const fetchDomain = useCallback(async () => {
    try {
      setDomain(undefined);
      const result = await getDomain(domainId);
      setDomain(result);
    } catch (e) {
      console.error(e);
    }
  }, [domainId, getDomain]);

  useEffect(() => {
    fetchDomain();
  }, [fetchDomain]);

  return (
    <Paper classes={{ root: classes.root }}>
      <div className={classes.inner}>
        <pre>{JSON.stringify(domain, undefined, '  ')}</pre>
      </div>
    </Paper>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    border: `2px solid ${theme.palette.primary.main}`,
    marginBottom: '1rem'
  },
  inner: {
    padding: '1.5rem'
  }
}));
