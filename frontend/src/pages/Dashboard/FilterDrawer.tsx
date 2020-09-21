import React, { useMemo } from 'react';
import {
  Paper,
  Accordion as MuiAccordion,
  AccordionSummary as MuiAccordionSummary,
  AccordionDetails,
  makeStyles,
  withStyles
} from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import { FaFilter } from 'react-icons/fa';
import { TableInstance } from 'react-table';
import { TaggedArrayInput } from 'components';
import { Domain } from 'types';

interface Props {
  instance: TableInstance<Domain>;
}

export const FilterDrawer: React.FC<Props> = props => {
  const {
    instance: { state: tableState, setFilter }
  } = props;
  const { filters } = tableState;
  const classes = useStyles();

  const filtersByColumn = useMemo(
    () =>
      filters.reduce(
        (allFilters, nextFilter) => ({
          ...allFilters,
          [nextFilter.id]: nextFilter.value
        }),
        {} as Record<string, string[]>
      ),
    [filters]
  );

  console.log(filtersByColumn);

  return (
    <Wrapper>
      <div className={classes.header}>
        <FaFilter /> <h3>Filter</h3>
      </div>
      <Accordion elevation={0} square disabled={!!filtersByColumn.ip?.length}>
        <AccordionSummary expandIcon={<ExpandMore />}>IP(s)</AccordionSummary>
        <AccordionDetails>
          <TaggedArrayInput
            values={filtersByColumn.ip ?? []}
            onChange={values => setFilter('ip', values)}
          />
        </AccordionDetails>
      </Accordion>
      <Accordion
        elevation={0}
        square
        disabled={!!filtersByColumn.reverseName?.length}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          Domain(s)
        </AccordionSummary>
        <AccordionDetails>
          <TaggedArrayInput
            values={filtersByColumn.reverseName ?? []}
            onChange={values => setFilter('reverseName', values)}
          />
        </AccordionDetails>
      </Accordion>
      <Accordion elevation={0} square disabled={!!filtersByColumn.port?.length}>
        <AccordionSummary expandIcon={<ExpandMore />}>Port(s)</AccordionSummary>
        <AccordionDetails>
          <TaggedArrayInput
            values={filtersByColumn.port ?? []}
            onChange={values => setFilter('port', values)}
          />
        </AccordionDetails>
      </Accordion>
      <Accordion
        elevation={0}
        square
        disabled={!!filtersByColumn.services?.length}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          Service(s)
        </AccordionSummary>
        <AccordionDetails>
          <TaggedArrayInput
            values={filtersByColumn.services ?? []}
            onChange={values => setFilter('services', values)}
          />
        </AccordionDetails>
      </Accordion>
      <Accordion elevation={0} square>
        <AccordionSummary expandIcon={<ExpandMore />}>
          Date Range
        </AccordionSummary>
        <AccordionDetails>AIDSPFNASDPFIN</AccordionDetails>
      </Accordion>
    </Wrapper>
  );
};

const Accordion = withStyles({
  root: {
    backgroundColor: '#f4f4f4',
    border: '1px solid rgba(0,0,0,.125)',
    boxShadow: 'none',
    '&:not(:last-child)': {
      borderBottom: 0
    },
    '&:before': {
      display: 'none'
    },
    margin: 0,
    '&$expanded': {
      margin: 0
    },
    '&$disabled': {
      backgroundColor: '#f4f4f4'
    }
  },
  disabled: {},
  expanded: {}
})(MuiAccordion);

const AccordionSummary = withStyles({
  root: {
    color: '#3D4551',
    minHeight: 64,
    '&$expanded': {
      minHeight: 64
    },
    '&:focus': {
      outline: 'none !important'
    },
    '&$disabled': {
      opacity: 1,
      fontWeight: 600,

      '& svg': {
        opacity: 0.5
      }
    }
  },
  disabled: {},
  expanded: {}
})(MuiAccordionSummary);

const Wrapper = withStyles({
  root: {
    height: '100%',
    position: 'relative',
    flex: '0 0 250px',
    backgroundColor: '#f4f4f4',
    color: '#3D4551',
    overflowY: 'auto'
  }
})(Paper);

const useStyles = makeStyles(theme => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    flexFlow: 'row nowrap',
    padding: '0 1rem',
    minHeight: 60,
    '& h3': {
      fontSize: '1.3rem',
      fontWeight: 400,
      margin: 0,
      marginLeft: '1rem'
    }
  }
}));
