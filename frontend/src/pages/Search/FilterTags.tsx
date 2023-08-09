import React, { useMemo } from 'react';
import { styled } from '@mui/material/styles';
import { ContextType } from '../../context/SearchProvider';
import { Chip } from '@mui/material';

const PREFIX = 'FilterTags';

const classes = {
  chip: `${PREFIX}-chip`
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.chip}`]: {
    margin: '0 0.5rem'
  }
}));

interface Props {
  filters: ContextType['filters'];
  removeFilter: ContextType['removeFilter'];
}

type FlatFilters = {
  field: string;
  label: string;
  value: any;
  values: any[];
  type: 'all' | 'none' | 'any';
}[];

export const FilterTags: React.FC<Props> = (props) => {
  const { filters, removeFilter } = props;

  const filtersByColumn: FlatFilters = useMemo(
    () =>
      filters.reduce(
        (acc, nextFilter) => [
          ...acc,
          {
            ...nextFilter,
            value: nextFilter.values.join(', '),
            label: nextFilter.field.split('.').pop()
          }
        ],
        []
      ),
    [filters]
  );

  return (
    <Root>
      {filtersByColumn.map((filter, idx) => (
        <Chip
          key={idx}
          color="primary"
          classes={{ root: classes.chip }}
          label={
            <>
              <strong>{filter.label}:</strong> {filter.value}
            </>
          }
          onDelete={() => {
            filter.values.forEach((val) => {
              removeFilter(filter.field, val, filter.type);
            });
          }}
        />
      ))}
    </Root>
  );
};
