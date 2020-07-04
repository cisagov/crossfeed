import React from 'react';
import classes from './styles.module.scss';

interface Props {
  title: string;
  value?: string | null;
  splitOn?: string;
}

export const Item: React.FC<Props> = ({ title, value, splitOn = ',' }) => {
  return (
    <>
      {value && (
        <div className={classes.item}>
          <label>{title}</label>
          <div className={classes.content}>
            {value.split(splitOn).map((val, index) => (
              <div key={index}>{val}</div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
