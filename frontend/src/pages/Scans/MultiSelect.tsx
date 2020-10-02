import React from 'react';
import Select, { components } from 'react-select';
import { Props } from 'react-select';
import arrow from './arrow-both.svg';

const DropdownIndicator: React.FC<any> = props => {
  return (
    <components.DropdownIndicator {...props}>
      <img src={arrow} alt="Expand" style={{ width: 8, marginRight: 3 }} />
    </components.DropdownIndicator>
  );
};

export default (props: Props) => {
  return (
    <Select
      isMulti
      {...props}
      components={{
        DropdownIndicator,
        IndicatorSeparator: () => null
      }}
      styles={{
        container: (provided, state) => ({
          ...provided,
          maxWidth: '30rem',
          zIndex: 99
        }),
        control: (provided, state) => ({
          ...provided,
          borderColor: '#565c65',
          borderWidth: 1,
          marginTop: '0.5rem',
          height: '2.5rem',
          borderRadius: 0
        })
      }}
    />
  );
};
