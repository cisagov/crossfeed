import React from 'react';
import classes from './Risk.module.css';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { count } from 'console';
import { Link } from 'react-router-dom';
import { Table } from '@trussworks/react-uswds';
import { FaAngleDoubleRight, FaInfoCircle } from 'react-icons/fa';

const pieData = [
  {
    id: 'php',
    label: 'PHP',
    value: 12,
    color: 'hsl(275, 70%, 50%)'
  },
  {
    id: 'node',
    label: 'Node',
    value: 107,
    color: 'hsl(278, 70%, 50%)'
  },
  {
    id: 'ruby',
    label: 'Ruby',
    value: 0,
    color: 'hsl(177, 70%, 50%)'
  },
  {
    id: 'python',
    label: 'Python',
    value: 138,
    color: 'hsl(50, 70%, 50%)'
  },
  {
    id: 'golang',
    label: 'Golang',
    value: 267,
    color: 'hsl(159, 70%, 50%)'
  }
];
const MyResponsivePie = () => (
  <ResponsivePie
    data={pieData}
    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
    innerRadius={0.5}
    padAngle={0.7}
    defs={[
      {
        id: 'dots',
        type: 'patternDots',
        background: 'inherit',
        color: 'rgba(255, 255, 255, 0.3)',
        size: 4,
        padding: 1,
        stagger: true
      },
      {
        id: 'lines',
        type: 'patternLines',
        background: 'inherit',
        color: 'rgba(255, 255, 255, 0.3)',
        rotation: -45,
        lineWidth: 6,
        spacing: 10
      }
    ]}
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

const MyResponsiveBar = () => (
  <ResponsiveBar
    data={barData}
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
  return (
    <div className={classes.root}>
      <h1>Risk Dashboard: cisa.gov</h1>
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
          <MyResponsivePie />
        </div>

        <div
          style={{ width: '500px', height: '500px', display: 'inline-block' }}
        >
          <MyResponsiveBar />
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
          <MyResponsivePie />
        </div>

        <div
          style={{ width: '500px', height: '500px', display: 'inline-block' }}
        >
          <MyResponsiveBar />
        </div>
      </div>
    </div>
  );
};

export default Risk;
