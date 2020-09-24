import React, { useMemo } from 'react';
import { ContextType } from './SearchProvider';
import { Chip, makeStyles } from '@material-ui/core';

interface Props {
  filters: ContextType['filters'];
  removeFilter: ContextType['removeFilter'];
}

type FlatFilters = {
  field: string;
  fullField: string;
  value: any;
  type: 'all' | 'none' | 'any';
}[];

export const FilterTags: React.FC<Props> = props => {
  const { filters, removeFilter } = props;
  const classes = useStyles();

  const filtersByColumn: FlatFilters = useMemo(
    () =>
      filters.reduce(
        (acc, nextFilter) => [
          ...acc,
          ...nextFilter.values.map((value: any) => ({
            field: nextFilter.field.split('.').pop(),
            fullField: nextFilter.field,
            type: nextFilter.type,
            value
          }))
        ],
        []
      ),
    [filters]
  );

  return (
    <div>
      {filtersByColumn.map(filter => (
        <Chip
          classes={{ root: classes.chip }}
          label={`${filter.field}: ${filter.value}`}
          onDelete={() => {
            removeFilter(filter.fullField, filter.value, filter.type);
          }}
        />
      ))}
    </div>
  );
};

const useStyles = makeStyles(theme => ({
  chip: {
    margin: '0 0.5rem'
  }
}));
