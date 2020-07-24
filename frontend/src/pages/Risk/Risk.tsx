import React from 'react';
import classes from './Risk.module.css';
import { ResponsivePie, PieDatum } from '@nivo/pie';
import { ResponsiveBar, BarDatum } from '@nivo/bar';
import { Table } from '@trussworks/react-uswds';
import { FaInfoCircle } from 'react-icons/fa';
import { useAuthContext } from 'context';

// TODO: Pull in actual data to render charts
const pieData = [
  {
    id: 'java',
    label: 'Java',
    value: 12,
    color: 'hsl(275, 70%, 50%)'
  },
  {
    id: 'akamai',
    label: 'Akamai',
    value: 107,
    color: 'hsl(278, 70%, 50%)'
  },
  {
    id: 'apache',
    label: 'Apache',
    value: 0,
    color: 'hsl(177, 70%, 50%)'
  },
  {
    id: 'drupal',
    label: 'Drupal',
    value: 138,
    color: 'hsl(50, 70%, 50%)'
  },
  {
    id: 'wordpress',
    label: 'Wordpress',
    value: 267,
    color: 'hsl(159, 70%, 50%)'
  }
];
const pieData2 = [
  {
    id: 'low',
    label: 'Low',
    value: 5,
    color: 'hsl(275, 70%, 50%)'
  },
  {
    id: 'medium',
    label: 'Medium',
    value: 3,
    color: 'hsl(50, 70%, 50%)'
  },
  {
    id: 'high',
    label: 'High',
    value: 1,
    color: 'hsl(177, 70%, 50%)'
  },
  {
    id: 'critical',
    label: 'Critical',
    value: 1,
    color: 'hsl(278, 70%, 50%)'
  }
];
const MyResponsivePie = ({ data }: { data: PieDatum[] }) => (
  <ResponsivePie
    data={data}
    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
    innerRadius={0.5}
    padAngle={0.7}
  />
);

const barData = [
  {
    port: '443',
    count: 18,
    color: 'hsl(275, 70%, 50%)'
  },
  {
    port: '80',
    count: 16,
    color: 'hsl(278, 70%, 50%)'
  },
  {
    port: '22',
    count: 5,
    color: 'hsl(177, 70%, 50%)'
  },
  {
    port: '21',
    count: 2,
    color: 'hsl(50, 70%, 50%)'
  },
  {
    port: '8080',
    count: 2,
    color: 'hsl(159, 70%, 50%)'
  }
];
const barData2 = [
  {
    port: '443',
    count: 18,
    color: 'hsl(275, 70%, 50%)'
  },
  {
    port: '80',
    count: 16,
    color: 'hsl(278, 70%, 50%)'
  },
  {
    port: '22',
    count: 5,
    color: 'hsl(177, 70%, 50%)'
  },
  {
    port: '21',
    count: 2,
    color: 'hsl(50, 70%, 50%)'
  },
  {
    port: '8080',
    count: 2,
    color: 'hsl(159, 70%, 50%)'
  }
];

const MyResponsiveBar = ({ data }: { data: BarDatum[] }) => (
  <ResponsiveBar
    data={data}
    keys={['count']}
    indexBy="port"
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
  />
);

const Risk: React.FC = () => {
  const { currentOrganization } = useAuthContext();

  return (
    <div className={classes.root}>
      <h1>{currentOrganization?.name} Risk Dashboard</h1>
      <h2>Total domains: 24</h2>
      <h1>Top Action Items</h1>
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
      </Table>
      <h1>Technology Breakdown</h1>
      <div>
        <div
          style={{
            width: '500px',
            height: '500px',
            display: 'inline-block',
            marginRight: '100px'
          }}
        >
          <h3>Most common services</h3>
          <MyResponsivePie data={pieData} />
        </div>

        <div
          style={{ width: '500px', height: '500px', display: 'inline-block' }}
        >
          <h3>Most common ports</h3>
          <MyResponsiveBar data={barData} />
        </div>
      </div>
      <h1>Vulnerabilities Breakdown</h1>
      <div>
        <div
          style={{
            width: '500px',
            height: '500px',
            display: 'inline-block',
            marginRight: '100px'
          }}
        >
          <h3>Severity Levels</h3>
          <MyResponsivePie data={pieData2} />
        </div>

        <div
          style={{ width: '500px', height: '500px', display: 'inline-block' }}
        >
          <h3>Open Vulnerabilities by Domain</h3>
          <MyResponsiveBar data={barData2} />
        </div>
        <br></br>
        <br></br>
        <br></br>
        <br></br>
      </div>
    </div>
  );
};

export default Risk;
