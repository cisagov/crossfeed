import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Paper } from '@material-ui/core';
import { Point } from './Risk';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { resultsPerPage, getSingleColor, getSeverityColor } from './utils';
import { useRiskStyles } from './style';

const BarChartCardSmall = (props: {
  data: Point[];
  xLabels: string[];
  type: string;
}) => {
  const history = useHistory();
  const { data, xLabels, type } = props;
  const { cardRoot, cardSmall, header, chartSmall } = useRiskStyles();
  const keys = xLabels;
  const [domainsWithVulns, setDomainsWithVulns] = useState(0);
  const [current, setCurrent] = useState(1);
  let dataVal: object[];
  const pageStart = (current - 1) * resultsPerPage;
  if (type === 'ports') {
    dataVal = data.map((e) => ({ ...e, [xLabels[0]]: e.value })) as any;
  } else {
    // Separate count by severity
    const domainToSevMap: any = {};
    for (const point of data) {
      const split = point.id.split('|');
      const domain = split[0];
      const severity = split[1];
      if (xLabels.includes(severity)) {
        if (!(domain in domainToSevMap)) domainToSevMap[domain] = {};
        domainToSevMap[domain][severity] = point.value;
      }
    }
    setDomainsWithVulns(Object.keys(domainToSevMap).length);
    dataVal = Object.keys(domainToSevMap)
      .map((key) => ({
        label: key,
        ...domainToSevMap[key]
      }))
      .sort((a, b) => {
        let diff = 0;
        for (const label of xLabels) {
          diff += (label in b ? b[label] : 0) - (label in a ? a[label] : 0);
        }
        return diff;
      })
      .slice(pageStart, Math.min(pageStart + 30, domainsWithVulns))
      .reverse();
  }
  // create the total vuln labels for each domain
  const totalLabels = ({ bars, width }: any) => {
    const fullWidth = width + 5;
    return bars.map(
      ({ data: { data, indexValue }, y, height, width }: any, i: number) => {
        const total = Object.keys(data)
          .filter((key) => key !== 'label')
          .reduce((a, key) => a + data[key], 0);
        if (i < dataVal.length) {
          return (
            <g
              transform={`translate(${fullWidth}, ${y})`}
              key={`${indexValue}-${i}`}
            >
              <text
                x={10}
                y={height / 2}
                textAnchor="middle"
                alignmentBaseline="central"
                // add any style to the label here
                style={{
                  fill: 'rgb(51, 51, 51)',
                  fontSize: 12
                }}
              >
                {total}
              </text>
            </g>
          );
        }
        return null;
      }
    );
  };
  return (
    <ResponsiveBar
      data={dataVal as any}
      keys={keys}
      layers={
        type === 'ports'
          ? ['grid', 'axes', 'bars', 'markers', 'legends']
          : ['grid', 'axes', 'bars', totalLabels, 'markers', 'legends']
      }
      indexBy="label"
      margin={{
        top: 30,
        right: 40,
        bottom: 75,
        left: 100
      }}
      theme={{
        fontSize: 12,
        axis: {
          legend: {
            text: {
              fontWeight: 'bold'
            }
          }
        }
      }}
      onClick={(event) => {
        if (type === 'vulns') {
          history.push(
            `/inventory/vulnerabilities?domain=${event.data.label}&severity=${event.id}`
          );
        } else if (type === 'ports') {
          history.push(
            `/inventory?filters[0][field]=services.port&filters[0][values][0]=n_${event.data.label}_n&filters[0][type]=any`
          );
          window.location.reload();
        }
      }}
      padding={0.5}
      colors={type === 'ports' ? getSingleColor : (getSeverityColor as any)}
      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 0,
        tickPadding: 5,
        tickRotation: 0,
        legend: type === 'ports' ? 'Count' : '',
        legendPosition: 'middle',
        legendOffset: 40
      }}
      axisLeft={{
        tickSize: 0,
        tickPadding: 20,
        tickRotation: 0,
        legend: type === 'ports' ? 'Port' : '',
        legendPosition: 'middle',
        legendOffset: -65
      }}
      animate={true}
      enableLabel={false}
      motionDamping={15}
      layout={'horizontal'}
      enableGridX={true}
      enableGridY={false}
      {...({ motionStiffness: 90 } as any)}
    />
  );
};
export default BarChartCardSmall;
