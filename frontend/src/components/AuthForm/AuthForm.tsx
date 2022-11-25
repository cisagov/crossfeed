import React, { ElementType } from 'react';
import classes from './styles.module.scss';

interface Props extends Partial<JSX.IntrinsicElements['form']> {
  // If set, will use this component instead of <form>.
  as?: ElementType;
}

export const AuthForm: React.FC<Props> = ({
  children,
  as: Tag = 'form',
  ...rest
}) => {
  return (
    <div className={classes.root}>
      <Tag className={classes.form} {...rest}>
        {children}
      </Tag>
    </div>
  );
};
