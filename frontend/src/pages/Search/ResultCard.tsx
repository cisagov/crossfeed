import React from 'react';
import clsx from 'classnames';
import { makeStyles, Paper } from '@material-ui/core';
import { Result } from './SearchProvider';
import { parseISO, formatDistanceToNow } from 'date-fns';

interface Props extends Result {
  onDomainSelected(domainId: string): void;
  selected?: boolean;
}

export const ResultCard: React.FC<Props> = (props) => {
  const classes = useStyles(props);
  const {
    id,
    selected,
    name,
    ip,
    updatedAt,
    services,
    vulnerabilities,
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
      selected ? '2px solid #28A0CB' : '2px solid #DCDEE0'
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
