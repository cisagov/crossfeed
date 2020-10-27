import React, { useMemo } from 'react';
import {
  Paper,
  Accordion as MuiAccordion,
  AccordionSummary as MuiAccordionSummary,
  AccordionDetails,
  makeStyles,
  withStyles
} from '@material-ui/core';
import { ExpandMore, FiberManualRecordRounded } from '@material-ui/icons';
import { FaFilter } from 'react-icons/fa';
import { TaggedArrayInput, FacetFilter } from 'components';
import { ContextType } from './SearchProvider';

interface Props {
  addFilter: ContextType['addFilter'];
  removeFilter: ContextType['removeFilter'];
  filters: ContextType['filters'];
  facets: ContextType['facets'];
}

const FiltersApplied: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.applied}>
      <FiberManualRecordRounded /> Filters Applied
    </div>
  );
};

export const FilterDrawer: React.FC<Props> = (props) => {
  const { filters, addFilter, removeFilter, facets } = props;
  const classes = useStyles();

  const filtersByColumn = useMemo(
    () =>
      filters.reduce(
        (allFilters, nextFilter) => ({
          ...allFilters,
          [nextFilter.field]: nextFilter.values
        }),
        {} as Record<string, string[]>
      ),
    [filters]
  );

  const portFacet: any[] = facets['services.port']
    ? facets['services.port'][0].data
    : [];

  const fromDomainFacet: any[] = facets['fromRootDomain']
    ? facets['fromRootDomain'][0].data
    : [];

  const cveFacet: any[] = facets['vulnerabilities.cve']
    ? facets['vulnerabilities.cve'][0].data
    : [];

  const severityFacet: any[] = facets['vulnerabilities.severity']
    ? facets['vulnerabilities.severity'][0].data
    : [];

  // Always show all severities
  for (const value of ['Critical', 'High', 'Medium', 'Low']) {
    if (!severityFacet.find((severity) => value === severity.value))
      severityFacet.push({ value, count: 0 });
  }

  return (
    <Wrapper>
      <div className={classes.header}>
        <FaFilter /> <h3>Filter</h3>
      </div>
      <Accordion elevation={0} square>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <div>IP(s)</div>
          {filtersByColumn['ip']?.length > 0 && <FiltersApplied />}
        </AccordionSummary>
        <AccordionDetails classes={{ root: classes.details }}>
          <TaggedArrayInput
            placeholder="IP address"
            values={filtersByColumn.ip ?? []}
            onAddTag={(value) => addFilter('ip', value, 'any')}
            onRemoveTag={(value) => removeFilter('ip', value, 'any')}
          />
        </AccordionDetails>
      </Accordion>
      <Accordion elevation={0} square>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <div>Domain(s)</div>
          {filtersByColumn['name']?.length > 0 && <FiltersApplied />}
        </AccordionSummary>
        <AccordionDetails classes={{ root: classes.details }}>
          <TaggedArrayInput
            placeholder="Domain"
            values={filtersByColumn.name ?? []}
            onAddTag={(value) => addFilter('name', value, 'any')}
            onRemoveTag={(value) => removeFilter('name', value, 'any')}
          />
        </AccordionDetails>
      </Accordion>
      {fromDomainFacet.length > 0 && (
        <Accordion elevation={0} square>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <div>Root Domain(s)</div>
            {filtersByColumn['fromRootDomain']?.length > 0 && (
              <FiltersApplied />
            )}
          </AccordionSummary>
          <AccordionDetails classes={{ root: classes.details }}>
            <FacetFilter
              options={fromDomainFacet}
              selected={filtersByColumn['fromRootDomain'] ?? []}
              onSelect={(value) => addFilter('fromRootDomain', value, 'any')}
              onDeselect={(value) =>
                removeFilter('fromRootDomain', value, 'any')
              }
            />
          </AccordionDetails>
        </Accordion>
      )}
      {portFacet.length > 0 && (
        <Accordion elevation={0} square>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <div>Port(s)</div>
            {filtersByColumn['services.port']?.length > 0 && <FiltersApplied />}
          </AccordionSummary>
          <AccordionDetails classes={{ root: classes.details }}>
            <FacetFilter
              options={portFacet}
              selected={filtersByColumn['services.port'] ?? []}
              onSelect={(value) => addFilter('services.port', value, 'any')}
              onDeselect={(value) =>
                removeFilter('services.port', value, 'any')
              }
            />
          </AccordionDetails>
        </Accordion>
      )}
      {cveFacet.length > 0 && (
        <Accordion elevation={0} square>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <div>CVE(s)</div>
            {filtersByColumn['vulnerabilities.cve']?.length > 0 && (
              <FiltersApplied />
            )}
          </AccordionSummary>
          <AccordionDetails classes={{ root: classes.details }}>
            <FacetFilter
              options={cveFacet}
              selected={filtersByColumn['vulnerabilities.cve'] ?? []}
              onSelect={(value) =>
                addFilter('vulnerabilities.cve', value, 'any')
              }
              onDeselect={(value) =>
                removeFilter('vulnerabilities.cve', value, 'any')
              }
            />
          </AccordionDetails>
        </Accordion>
      )}
      {severityFacet.length > 0 && (
        <Accordion elevation={0} square>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <div>Severity</div>
            {filtersByColumn['vulnerabilities.severity']?.length > 0 && (
              <FiltersApplied />
            )}
          </AccordionSummary>
          <AccordionDetails classes={{ root: classes.details }}>
            <FacetFilter
              options={severityFacet}
              selected={filtersByColumn['vulnerabilities.severity'] ?? []}
              onSelect={(value) =>
                addFilter('vulnerabilities.severity', value, 'any')
              }
              onDeselect={(value) =>
                removeFilter('vulnerabilities.severity', value, 'any')
              }
            />
          </AccordionDetails>
        </Accordion>
      )}
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
  content: {
    flexFlow: 'column nowrap',
    alignItems: 'flex-start',
    justifyContent: 'center'
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

const useStyles = makeStyles((theme) => ({
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
  },
  details: {
    paddingTop: 0
    // maxHeight: 250,
    // overflowY: 'auto'
  },
  applied: {
    display: 'flex',
    alignItems: 'center',
    flexFlow: 'row nowrap',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    color: theme.palette.grey['500'],

    '& svg': {
      fontSize: '0.7rem',
      color: theme.palette.primary.main,
      marginRight: 3
    }
  }
}));
