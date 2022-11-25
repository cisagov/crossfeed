import React, { useState } from 'react';
import clsx from 'classnames';
import { makeStyles, Paper } from '@material-ui/core';
import { Result } from '../../context/SearchProvider';
// @ts-ignore:next-line
import { parseISO, formatDistanceToNow } from 'date-fns';
import { sanitize } from 'dompurify';

// Sync this with the backend client in es-client.ts.
export interface WebpageRecord {
  webpage_id: string;
  webpage_createdAt: Date;
  webpage_updatedAt: Date;
  webpage_syncedAt: Date;
  webpage_lastSeen: Date;
  webpage_s3Key: string;
  webpage_url: string;
  webpage_status: string | number;
  webpage_domainId: string;
  webpage_discoveredById: string;

  // Added before elasticsearch insertion (not present in the database):
  suggest?: { input: string | string[]; weight: number }[];
  parent_join?: {
    name: 'webpage';
    parent: string;
  };
  webpage_body?: string;
}

interface Highlight {
  webpage_body: string[];
}

interface Props extends Result {
  onDomainSelected(domainId: string): void;
  selected?: boolean;
  inner_hits?: {
    webpage?: {
      hits: {
        hits: { _source: WebpageRecord; highlight: Highlight }[];
        max_score: number;
        total: {
          value: number;
          relation: string;
        };
      };
    };
  };
}

const filterExpanded = (
  data: any[],
  isExpanded: boolean,
  count: number = 3
) => {
  return isExpanded ? data : data.slice(0, count);
};

export const ResultCard: React.FC<Props> = (props) => {
  const classes = useStyles(props);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const {
    id,
    name,
    ip,
    updatedAt,
    services,
    vulnerabilities,
    inner_hits,
    onDomainSelected
  } = props;

  const toggleExpanded = (key: string) => {
    setExpanded((expanded) => ({
      ...expanded,
      [key]: expanded[key] ? !expanded[key] : true
    }));
  };

  let lastSeen;
  try {
    lastSeen = formatDistanceToNow(parseISO(updatedAt.raw));
  } catch (e) {
    lastSeen = '';
  }

  const onClick = () => {
    onDomainSelected(id.raw);
  };

  const ports = services.raw.reduce(
    (acc, nextService) => [...acc, nextService.port],
    []
  );

  const products = services.raw.reduce(
    (acc, nextService) => [
      ...acc,
      ...nextService.products.map(
        (p: any) => `${p.name}${p.version ? ' ' + p.version : ''}`
      )
    ],
    []
  );

  const cves = vulnerabilities.raw.reduce(
    (acc, nextVuln) => [...acc, nextVuln.cve],
    []
  );

  const data = [];
  if (products.length > 0) {
    data.push({
      label: `Product${products.length > 1 ? 's' : ''}`,
      count: products.length,
      value: filterExpanded(
        [...Array.from(new Set(products))],
        Boolean(expanded.products),
        8
      ).join(', '),
      onExpand: () => toggleExpanded('products'),
      expansionText:
        products.length <= 8 ? null : expanded.products ? 'less' : 'more'
    });
  }
  if (cves.length > 0) {
    data.push({
      label: `CVE${cves.length > 1 ? 's' : ''}`,
      count: cves.length,
      value: filterExpanded(cves, Boolean(expanded.vulns), 10).join(', '),
      onExpand: () => toggleExpanded('vulns'),
      expansionText: cves.length <= 10 ? null : expanded.vulns ? 'less' : 'more'
    });
  }
  if (inner_hits?.webpage?.hits?.hits?.length! > 0) {
    const { hits } = inner_hits!.webpage!.hits!;
    data.push({
      label: `matching webpage${hits.length > 1 ? 's' : ''}`,
      count: hits.length,
      value: hits.map((e, idx) => (
        <React.Fragment key={idx}>
          <small>
            <strong>{e._source.webpage_url}</strong>
            <br />
            {e.highlight?.webpage_body?.map((body, idx) => (
              <React.Fragment key={idx}>
                <code
                  dangerouslySetInnerHTML={{
                    __html: sanitize(body, { ALLOWED_TAGS: ['em'] })
                  }}
                />
              </React.Fragment>
            ))}
          </small>
        </React.Fragment>
      ))
    });
  }

  return (
    <Paper
      elevation={0}
      classes={{ root: classes.root }}
      aria-label="view domain details"
    >
      <div className={classes.inner} onClick={onClick}>
        <button className={classes.domainRow}>
          <h4>{name.raw}</h4>
          <div className={classes.lastSeen}>
            <span className={classes.label}>Last Seen</span>
            <span className={classes.data}>{lastSeen} ago</span>
          </div>
        </button>

        {ip.raw && (
          <div className={clsx(classes.ipRow, classes.row)}>
            <div>
              <span className={classes.label}>IP</span>
              <span className={classes.data}>{ip.raw}</span>
            </div>
            {ports.length > 0 && (
              <div className={classes.lastSeen}>
                <span className={classes.label}>
                  <span className={classes.count}>{ports.length}</span>
                  {` Port${ports.length > 1 ? 's' : ''}`}
                </span>
                <span className={classes.data}>{ports.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {data.map(({ label, value, count, onExpand, expansionText }) => (
          <p className={classes.row} key={label}>
            <span className={classes.label}>
              {count !== undefined && (
                <span className={classes.count}>{count} </span>
              )}
              {label}
            </span>
            <span className={classes.data}>
              {value}
              {expansionText && (
                <button
                  className={classes.expandMore}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (onExpand) onExpand();
                  }}
                >
                  {expansionText}
                </button>
              )}
            </span>
          </p>
        ))}
      </div>
    </Paper>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    boxSizing: 'border-box',
    marginBottom: '1rem',
    border: ({ selected }: Props) =>
      selected
        ? `2px solid ${theme.palette.primary.main}`
        : '2px solid #DCDEE0',
    boxShadow: ({ selected }: Props) =>
      selected ? '0px 1px 6px rgba(0, 0, 0, 0.25)' : 'none',
    '& em': {
      fontStyle: 'normal',
      backgroundColor: 'yellow'
    }
  },
  inner: {
    padding: '1.5rem',
    paddingTop: '0.875rem',
    cursor: 'pointer'
  },
  domainRow: {
    width: '100%',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#28A0CB',
    outline: 'none',
    background: 'none',
    border: 'none',
    padding: '0.5rem 0',

    '&:focus': {
      outline: 'none !important'
    },
    '& h4': {
      fontWeight: 400,
      cursor: 'pointer',
      display: 'block',
      fontSize: '1.9rem',
      color: '#07648D',
      margin: 0,
      textAlign: 'left',
      wordBreak: 'break-all',
      paddingRight: '1rem'
    }
  },
  ipRow: {
    display: 'flex',
    flexFlow: 'row nowrap',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  row: {
    padding: '0.5rem 0',
    margin: 0
  },
  label: {
    fontSize: '0.8rem',
    color: '#71767A',
    display: 'block'
  },
  count: {
    color: theme.palette.error.light
  },
  data: {
    display: 'block',
    color: '#3D4551'
  },
  lastSeen: {
    display: 'block',
    textAlign: 'right'
  },
  expandMore: {
    outline: 'none',
    border: 'none',
    background: 'none',
    color: theme.palette.secondary.main,
    margin: '0 0.2rem',
    cursor: 'pointer'
  }
}));
