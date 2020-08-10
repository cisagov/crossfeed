import React, { useCallback, useState, useEffect } from 'react';
import classes from './Risk.module.scss';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { useAuthContext } from 'context';
import { Checkbox } from '@trussworks/react-uswds';

const getColor = ({ index }: { index: number }) => {
  const colors = ['rgb(0, 111, 162)', 'rgb(0, 185, 227)'];
  return colors[index % colors.length];
};

const MyResponsivePie = ({ data }: { data: Point[] }) => {
  return (
    <ResponsivePie
      data={data as any}
      margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
      innerRadius={0.5}
      padAngle={0.7}
      radialLabelsSkipAngle={10}
      slicesLabelsSkipAngle={10}
    />
  );
};

const MyResponsiveBar = ({
  data,
  xLabel,
  longXValues = false
}: {
  data: Point[];
  xLabel: string;
  longXValues?: boolean;
}) => {
  return (
    <ResponsiveBar
      data={data.map(e => ({ ...e, [xLabel]: e.value })) as any}
      keys={[xLabel]}
      indexBy="label"
      margin={{ top: 50, right: 130, bottom: longXValues ? 250 : 50, left: 60 }}
      padding={0.3}
      colors={getColor}
      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: longXValues ? 90 : 0,
        legend: longXValues ? '' : xLabel,
        legendPosition: 'middle',
        legendOffset: 40
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
      // isInteractive={false}
    />
  );
};

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
  const { currentOrganization, user, apiPost } = useAuthContext();

  const [stats, setStats] = useState<Stats | undefined>(undefined);
  const [showAll, setShowAll] = useState<boolean>(false);

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
    console.log(result);
    setStats(result);
  }, [showAll, apiPost, currentOrganization]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className={classes.root}>
      <h1>
        Risk Dashboard
        {currentOrganization ? ' - ' + currentOrganization.name : ''}
      </h1>
      {((user?.roles && user.roles.length > 0) ||
        user?.userType === 'globalView' ||
        user?.userType === 'globalAdmin') && (
        <Checkbox
          id="showAll"
          name="showAll"
          label="Show all organizations"
          checked={showAll}
          onChange={e => setShowAll(e.target.checked)}
          className={classes.showAll}
        />
      )}
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
            {stats.domains.services.length > 0 && (
              <div className={classes.chart}>
                <h3>Most common services</h3>
                <MyResponsivePie data={stats.domains.services} />
              </div>
            )}

            {stats.domains.ports.length > 0 && (
              <div className={classes.chart}>
                <h3>Most common ports</h3>
                <MyResponsiveBar data={stats.domains.ports} xLabel={'Port'} />
              </div>
            )}
          </div>
          <h1>Vulnerabilities Breakdown</h1>
          <div>
            {stats.vulnerabilities.severity.length > 0 && (
              <div className={classes.chart}>
                <h3>Severity Levels</h3>
                <MyResponsivePie data={stats.vulnerabilities.severity} />
              </div>
            )}

            {stats.domains.numVulnerabilities.length > 0 && (
              <div className={classes.chart}>
                <h3>Domains with the Most Open Vulnerabilities</h3>
                <MyResponsiveBar
                  data={stats.domains.numVulnerabilities}
                  xLabel={'Domain'}
                  longXValues={true}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Risk;
