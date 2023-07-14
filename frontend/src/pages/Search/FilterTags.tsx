import React, { useMemo } from 'react';
import { ContextType } from '../../context/SearchProvider';
import { Chip } from '@mui/material';

import makeStyles from '@mui/styles/makeStyles';

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
  const classes = useStyles();

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
    <div>
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
    </div>
  );
};

const useStyles = makeStyles((theme) => ({
  chip: {
    margin: '0 0.5rem'
  }
}));
