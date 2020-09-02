import React, { useCallback } from 'react';
import { Row } from 'react-table';
import { Service } from 'types';
import { Table } from 'components';
import { columns } from './columns';
import classes from './styles.module.scss';
import { uniq } from 'lodash';

interface Props {
  services: Service[];
}

const CodeBlock: React.FC<{}> = ({ children }) => {
  return <pre className={classes.codeBlock}>{children}</pre>;
};

export const ServicesTable: React.FC<Props> = ({ services }) => {
  const renderExpanded = useCallback((row: Row<Service>) => {
    const { original } = row;
    const cpes: string[] = uniq(original.intrigueIdentResults?.fingerprint?.map(e => e.cpe));
    return (
      <div className={classes.expandedRoot}>
        {original.banner && (
          <>
            <h4>Banner</h4>
            <CodeBlock>{original.banner}</CodeBlock>
          </>
        )}
        {original.censysIpv4Results &&
          Object.keys(original.censysIpv4Results)?.length > 0 && (
            <>
              <h4>Censys IPv4 Results</h4>
              <CodeBlock>
                {JSON.stringify(original.censysIpv4Results, null, 2)}
              </CodeBlock>
            </>
          )}
          {cpes && <>
          <h4>CPEs detected by Intrigue Ident</h4>
          {cpes.map(e => <div>{e}</div>)}
          </>}
      </div>
    );
  }, []);

  return (
    <Table<Service>
      columns={columns}
      data={services}
      pageSize={500}
      renderExpanded={renderExpanded}
      disableFilters
    />
  );
};
