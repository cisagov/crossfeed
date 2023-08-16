import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Chip } from '@material-ui/core';
import { Point, VulnSeverities } from './Risk';
import { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import {
  sevLabels,
  resultsPerPage,
  getSingleColor,
  getSeverityColor,
  severities
} from './utils';
import { useRiskStyles } from './style';
import { Pagination } from '@material-ui/lab';

const BarChartCardLarge = (props: {
  data: Point[];
  type: string;
  xLabels: string[];
}) => {
  const history = useHistory();
  const { data, type, xLabels } = props;
  const {
    header,
    chip,
    note,
    cardBig,
    seeAll,
    chartLarge,
    chipWrapper,
    chartHeader,
    footer
  } = useRiskStyles();
  const [domainsWithVulns, setDomainsWithVulns] = useState(0);
  const [current, setCurrent] = useState(1);
  const [labels, setLabels] = useState(sevLabels);
  const keys = xLabels;
  let dataVal: object[];
  const pageStart = (current - 1) * resultsPerPage;
  // Separate count by severity
  const domainToSevMap: any = {};
  for (const point of data) {
    const split = point.id.split('|');
    const domain = split[0];
    const severity = split[1];
    if (labels.includes(severity)) {
      if (!(domain in domainToSevMap)) domainToSevMap[domain] = {};
      domainToSevMap[domain][severity] = point.value;
    }
  }
  // setDomainsWithVulns(Object.keys(domainToSevMap).length);
  dataVal = Object.keys(domainToSevMap)
    .map((key) => ({
      label: key,
      ...domainToSevMap[key]
    }))
    .sort((a, b) => {
      let diff = 0;
      for (const label of labels) {
        diff += (label in b ? b[label] : 0) - (label in a ? a[label] : 0);
      }
      return diff;
    })
    .slice(pageStart, Math.min(pageStart + 30, domainsWithVulns))
    .reverse();
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
    <div className={cardBig}>
      <div className={seeAll}>
        <h4>
          <Link to="/inventory/vulnerabilities">See All</Link>
        </h4>
      </div>
      <div className={header}>
        <h2>Open Vulnerabilities by Domain</h2>
      </div>
      <div className={chartLarge}>
        {data.length === 0 ? (
          <h3>No open vulnerabilities</h3>
        ) : (
          <>
            <p className={note}>*Top 50 domains with open vulnerabilities</p>
            <div className={chipWrapper}>
              {severities.map((sevFilter: VulnSeverities, i: number) => (
                <Chip
                  key={i}
                  className={chip}
                  disabled={sevFilter.disable}
                  label={sevFilter.label}
                  onClick={() => {
                    setLabels(sevFilter.sevList);
                    setCurrent(1);
                  }}
                ></Chip>
              ))}
            </div>
            <div className={chartHeader}>
              <h5>Domain&emsp; Breakdown</h5>
              <h5 style={{ textAlign: 'right', paddingLeft: 0 }}>Total</h5>
            </div>
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
                top: 10,
                right: 40,
                bottom: 150,
                left: 260
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
              colors={
                type === 'ports' ? getSingleColor : (getSeverityColor as any)
              }
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
          </>
        )}
      </div>
      <div className={footer}>
        <span>
          <strong>
            {(domainsWithVulns === 0
              ? 0
              : (current - 1) * resultsPerPage + 1
            ).toLocaleString()}{' '}
            -{' '}
            {Math.min(
              (current - 1) * resultsPerPage + resultsPerPage,
              domainsWithVulns
            ).toLocaleString()}
          </strong>{' '}
          of <strong>{domainsWithVulns.toLocaleString()}</strong>
        </span>
        <Pagination
          count={Math.ceil(domainsWithVulns / resultsPerPage)}
          page={current}
          onChange={(_, page) => setCurrent(page)}
          color="primary"
          size="small"
        />
      </div>
    </div>
  );
};
export default BarChartCardLarge;
