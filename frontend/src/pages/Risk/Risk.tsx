import React, { useCallback, useState, useEffect } from 'react';
import classes from './Risk.module.scss';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { useAuthContext } from 'context';

const MyResponsivePie = ({ data }: { data: Point[] }) => {
  if (!data.length) {
    return <div>No data found.</div>;
  }
  return (<ResponsivePie
    data={data as any}
    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
    innerRadius={0.5}
    padAngle={0.7}
    radialLabelsSkipAngle={10}
    slicesLabelsSkipAngle={10}
  />);
};

const MyResponsiveBar = ({ data }: { data: Point[] }) => {
  if (!data.length) {
    return <div>No data found.</div>;
  }
  return (<ResponsiveBar
    data={data as any}
    keys={['value']}
    indexBy="label"
    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
    padding={0.3}
    colors={{ scheme: 'nivo' }}
    borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
    axisTop={null}
    axisRight={null}
    axisBottom={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Port',
      legendPosition: 'middle',
      legendOffset: 32
    }}
    axisLeft={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Count',
      legendPosition: 'middle',
      legendOffset: -40
    }}
    labelSkipWidth={12}
    labelSkipHeight={12}
    labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
    animate={true}
    motionStiffness={90}
    motionDamping={15}
  />);
}

interface Point {
  id: string;
  label: string;
  value: number;
}

interface Stats {
  domains: {
    services: Point[];
    ports: Point[];
    numVulnerabilities: Point[];
    total: number;
  };
  vulnerabilities: {
    severity: Point[];
  };
}

interface ApiResponse {
  result: Stats;
}

const Risk: React.FC = () => {
  const { currentOrganization, apiPost } = useAuthContext();

  const [stats, setStats] = useState<Stats | undefined>(undefined);
  const [showAll] = useState<boolean>(false);

  const fetchStats = useCallback(async () => {
    const { result } = await apiPost<ApiResponse>('/stats', {
      body: {
        filters: showAll
          ? {}
          : {
              organization: currentOrganization?.id
            }
      }
    });
    setStats(result);
  }, [showAll, apiPost]);

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className={classes.root}>
      <h1>
        Risk Dashboard
        {currentOrganization ? ' - ' + currentOrganization.name : ''}
      </h1>
      {stats && <h2>Total domains: {stats.domains.total}</h2>}
      {/* <h1>Top Action Items</h1>
      <Table bordered>
        <React.Fragment key=".0">
          <thead>
            <tr>
              <th scope="col">Action Item</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Patch CVE-2020-XYZ on 7 hosts</td>
              <td>
                <FaInfoCircle></FaInfoCircle>
              </td>
            </tr>
            <tr>
              <td>Confirm 3 new identified CIDR blocks</td>
              <td>
                <FaInfoCircle></FaInfoCircle>
              </td>
            </tr>
            <tr>
              <td>Tag and review 7 newly live domains</td>
              <td>
                <FaInfoCircle></FaInfoCircle>
              </td>
            </tr>
          </tbody>
        </React.Fragment>
      </Table> */}
      {stats && (
        <>
          <h1>Technology Breakdown</h1>
          <div>
          <div
              className={classes.chart}
            >
              <h3>Most common services</h3>
              <MyResponsivePie data={stats.domains.services} />
            </div>

            <div
              className={classes.chart}
            >
              <h3>Most common ports</h3>
              <MyResponsiveBar data={stats.domains.ports} />
            </div>
          </div>
          <h1>Vulnerabilities Breakdown</h1>
          <div>
            <div
              className={classes.chart}
            >
              <h3>Severity Levels</h3>
              <MyResponsivePie data={stats.vulnerabilities.severity} />
            </div>

            <div
              className={classes.chart}
            >
              <h3>Open Vulnerabilities by Domain</h3>
              <MyResponsiveBar data={stats.domains.numVulnerabilities} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Risk;
