import React from 'react';
import clsx from 'classnames';
import { makeStyles, Paper } from '@material-ui/core';
import { Result } from './SearchProvider';
import { parseISO, formatDistanceToNow } from 'date-fns';
import { sanitize } from 'dompurify';

// Sync this with the backend client in es-client.ts.
export interface WebpageRecord {
  webpage_id: string,
  webpage_createdAt: Date,
  webpage_updatedAt: Date,
  webpage_syncedAt: Date,
  webpage_lastSeen: Date,
  webpage_s3Key: string,
  webpage_url: string,
  webpage_status: string | number,
  webpage_domainId: string,
  webpage_discoveredById: string,
  
  // Added before elasticsearch insertion (not present in the database):
  suggest?: { input: string | string[]; weight: number }[];
  parent_join?: {
    name: "webpage",
    parent: string;
  }
  webpage_body?: string;
}

interface Highlight {
  webpage_body: string[]
}

interface Props extends Result {
  onDomainSelected(domainId: string): void;
  selected?: boolean;
  inner_hits?: {
    webpage?: {
      hits: {
        hits: {_source: WebpageRecord, highlight: Highlight}[],
        max_score: number,
        total: {
          value: number,
          relation: string
        }
      }
    }
  }
}

export const ResultCard: React.FC<Props> = (props) => {
  const classes = useStyles(props);
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
  if (ports.length > 0) {
    data.push({
      label: `port${ports.length > 1 ? 's' : ''}`,
      count: ports.length,
      value: ports.join(', ')
    });
  }
  if (products.length > 0) {
    data.push({
      label: `product${products.length > 1 ? 's' : ''}`,
      count: products.length,
      value: [...Array.from(new Set(products))].join(', ')
    });
  }
  if (cves.length > 0) {
    data.push({
      label: `vulnerabilit${cves.length > 1 ? 'ies' : 'y'}`,
      count: cves.length,
      value: cves.join(', ')
    });
  }
  if (inner_hits?.webpage?.hits?.hits?.length! > 0) {
    const { hits } = inner_hits!.webpage!.hits!;
    console.warn(hits.map(e => e._source.webpage_body));
    console.warn(hits.map(e => e.highlight));
    data.push({
      label: `matching webpage${hits.length > 1 ? 's' : ''}`,
      count: hits.length,
      value: hits.map(e => <div>
        <small>
        <strong>{e._source.webpage_url}</strong><br />
        {e.highlight?.webpage_body?.map(body => <div>
          <code dangerouslySetInnerHTML={{__html: sanitize(body, { ALLOWED_TAGS: ['em']})}} />
        </div> )}
        </small>
      </div>)
    });
  }

  return (
    <Paper elevation={0} classes={{ root: classes.root }}>
      <div className={classes.inner}>
        <button className={classes.domainRow} onClick={onClick}>
          <h4>{name.raw}</h4>
        </button>

        {ip.raw && (
          <div className={clsx(classes.ipRow, classes.row)}>
            <div>
              <span className={classes.label}>IP</span>
              <span>{ip.raw}</span>
            </div>
            <div className={classes.lastSeen}>
              <span className={classes.label}>Last Seen</span>
              <span>{lastSeen} ago</span>
            </div>
          </div>
        )}

        {data.map(({ label, value, count }) => (
          <p className={classes.row} key={label}>
            <span className={classes.label}>
              {count !== undefined && (
                <span className={classes.count}>{count} </span>
              )}
              {label}
            </span>
            <span className={classes.data}>{value}</span>
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
      selected ? `2px solid ${theme.palette.primary.main}` : 'none',
    boxShadow: '0px 1px 6px rgba(0, 0, 0, 0.25)',
    '& em': {
      fontStyle: 'normal',
      backgroundColor: 'yellow'
    }
  },
  inner: {
    padding: '1.5rem'
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
    cursor: 'pointer',

    '&:focus': {
      outline: 'none !important'
    },
    '& h4': {
      fontWeight: 400,
      display: 'block',
      fontSize: '1.9rem',
      color: '#28A0CB',
      margin: 0,
      textAlign: 'left',
      wordBreak: 'break-all',
      paddingRight: '1rem'
    },
    '& span': {
      display: 'block',
      textTransform: 'uppercase',
      fontSize: '1rem'
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
    display: 'block'
  },
  lastSeen: {
    textAlign: 'right'
  }
}));
