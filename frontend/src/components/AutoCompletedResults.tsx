import React from 'react';
import { Popover, PopoverProps, MenuItem } from '@mui/material';

interface Props extends PopoverProps {
  values: {
    id: { raw: string };
    text: { raw: string };
  }[];
}

export const AutoCompleteResults: React.FC<Props> = (props) => {
  const { values, ...rest } = props;

  return (
    <Popover {...rest}>
      {values.map((value) => (
        <MenuItem key={value.id.raw}>{value.text.raw}</MenuItem>
      ))}
    </Popover>
  );
};
