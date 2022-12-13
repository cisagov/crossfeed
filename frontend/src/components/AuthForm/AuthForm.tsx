import React from 'react';
import classes from './styles.module.scss';

interface Props extends Partial<JSX.IntrinsicElements['form']> {}

export const AuthForm: React.FC<Props> = ({ children, ...rest }) => {
  return (
    <div className={classes.root}>
      <form className={classes.form} {...rest}>
        {children}
      </form>
    </div>
  );
};
