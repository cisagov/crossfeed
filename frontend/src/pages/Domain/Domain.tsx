import React from 'react';
import { useParams } from 'react-router-dom';
import classes from './styles.module.scss';
import { DomainDetails } from 'components';

export const Domain: React.FC = () => {
  const { domainId } = useParams<any>();

  return (
    <div className={classes.root}>
      <div className={classes.inner}>
        <DomainDetails domainId={domainId} />
      </div>
    </div>
  );
};
