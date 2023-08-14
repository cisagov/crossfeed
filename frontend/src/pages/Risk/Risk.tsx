import React, { useCallback, useState, useEffect } from 'react';
import classes from './Risk.module.scss';
import VulnerabilityCard from './VulnerabilityCard';
import VulnerabilityPieChart from './VulnerabilityPieChart';
import { useRiskStyles } from './style';
import { getSingleColor, getSeverityColor, offsets, resultsPerPage } from './utils';
import { ResponsiveBar } from '@nivo/bar';
import { useAuthContext } from 'context';
import { Paper, Chip } from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import { geoCentroid } from 'd3-geo';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
  Annotation
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Link, useHistory } from 'react-router-dom';
import { Vulnerability } from 'types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Button as USWDSButton } from '@trussworks/react-uswds';

export interface Point {
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
    byOrg: Point[];
    latestVulnerabilities: Vulnerability[];
    mostCommonVulnerabilities: VulnerabilityCount[];
  };
}

interface ApiResponse {
  result: Stats;
}

interface VulnerabilityCount extends Vulnerability {
  count: number;
}

interface VulnSeverities {
  label: string;
  sevList: string[];
  disable?: boolean;
  amount?: number;
}

// Color Scale used for map
let colorScale = scaleLinear<string>()
  .domain([0, 1])
  .range(['#c7e8ff', '#135787']);

const Risk: React.FC = (props) => {
  const history = useHistory();
  const { currentOrganization, showAllOrganizations, showMaps, user, apiPost } =
    useAuthContext();

  const [stats, setStats] = useState<Stats | undefined>(undefined);
  const [labels, setLabels] = useState([
    '',
    'Low',
    'Medium',
    'High',
    'Critical'
  ]);
  const [domainsWithVulns, setDomainsWithVulns] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [current, setCurrent] = useState(1);
  const cardClasses = useRiskStyles(props);

  const geoStateUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

  const allColors = ['rgb(0, 111, 162)', 'rgb(0, 185, 227)'];

  const fetchStats = useCallback(
    async (orgId?: string) => {
      const { result } = await apiPost<ApiResponse>('/stats', {
        body: {
          filters:
            (!orgId && showAllOrganizations) || !currentOrganization
              ? {}
              : orgId || 'rootDomains' in currentOrganization
              ? {
                  organization: orgId ? orgId : currentOrganization?.id
                }
              : { tag: currentOrganization.id }
        }
      });
      const max = Math.max(...result.vulnerabilities.byOrg.map((p) => p.value));
      // Adjust color scale based on highest count
      colorScale = scaleLinear<string>()
        .domain([0, Math.log(max)])
        .range(['#c7e8ff', '#135787']);
      setStats(result);
    },
    [showAllOrganizations, apiPost, currentOrganization]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const VulnerabilityBarChart = ({
    data,
    xLabels,
    type,
    longXValues = false
  }: {
    data: Point[];
    xLabels: string[];
    type: string;
    longXValues?: boolean;
  }) => {
    const keys = xLabels;
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
        if (labels.includes(severity)) {
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
          top: longXValues ? 10 : 30,
          right: 40,
          bottom: longXValues ? 150 : 75,
          left: longXValues ? 260 : 100
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

  const MapCard = ({
    title,
    geoUrl,
    findFn
  }: {
    title: string;
    geoUrl: string;
    findFn: (geo: any) => Point | undefined;
    type: string;
  }) => (
    <Paper elevation={0} className={cardClasses.cardRoot}>
      <div>
        <div className={classes.chart}>
          <div className={cardClasses.header}>
            <h2>{title}</h2>
          </div>

          <ComposableMap
            data-tip="hello world"
            projection="geoAlbersUsa"
            style={{
              width: '90%',
              display: 'block',
              margin: 'auto'
            }}
          >
            <ZoomableGroup zoom={1}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const cur = findFn(geo) as
                      | (Point & {
                          orgId: string;
                        })
                      | undefined;
                    const centroid = geoCentroid(geo);
                    const name: string = geo.properties.name;
                    return (
                      <React.Fragment key={geo.rsmKey}>
                        <Geography
                          geography={geo}
                          fill={colorScale(cur ? Math.log(cur.value) : 0)}
                          onClick={() => {
                            if (cur) fetchStats(cur.orgId);
                          }}
                        />
                        <g>
                          {centroid[0] > -160 &&
                            centroid[0] < -67 &&
                            (Object.keys(offsets).indexOf(name) === -1 ? (
                              <Marker coordinates={centroid}>
                                <text y="2" fontSize={14} textAnchor="middle">
                                  {cur ? cur.value : 0}
                                </text>
                              </Marker>
                            ) : (
                              <Annotation
                                subject={centroid}
                                dx={offsets[name][0]}
                                dy={offsets[name][1]}
                                connectorProps={{}}
                              >
                                <text
                                  x={4}
                                  fontSize={14}
                                  alignmentBaseline="middle"
                                >
                                  {cur ? cur.value : 0}
                                </text>
                              </Annotation>
                            ))}
                        </g>
                      </React.Fragment>
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
          {/* <ReactTooltip>{tooltipContent}</ReactTooltip> */}
        </div>
      </div>
    </Paper>
  );

  // Group latest vulns together
  const latestVulnsGrouped: {
    [key: string]: VulnerabilityCount;
  } = {};
  if (stats) {
    for (const vuln of stats.vulnerabilities.latestVulnerabilities) {
      if (vuln.title in latestVulnsGrouped)
        latestVulnsGrouped[vuln.title].count++;
      else {
        latestVulnsGrouped[vuln.title] = { ...vuln, count: 1 };
      }
    }
  }

  const latestVulnsGroupedArr = Object.values(latestVulnsGrouped).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Create severity object for Open Vulnerability chips
  const severities: VulnSeverities[] = [
    { label: 'All', sevList: ['', 'Low', 'Medium', 'High', 'Critical'] },
    { label: 'Critical', sevList: ['Critical'] },
    { label: 'High', sevList: ['High'] },
    { label: 'Medium', sevList: ['Medium'] },
    { label: 'Low', sevList: ['Low'] }
  ];

  if (stats) {
    for (const sev of severities) {
      sev.disable = !stats.domains.numVulnerabilities.some((i) =>
        sev.sevList.includes(i.id.split('|')[1])
      );
    }
  }

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const generatePDF = async () => {
    const dateTimeNow = new Date(); // UTC Date Time
    const localDate = new Date(dateTimeNow); // Local Date Time
    setIsLoading(true);
    await delay(650);
    const input = document.getElementById('wrapper')!;
    input.style.width = '1400px';
    await delay(1);
    await html2canvas(input, {
      scrollX: 0,
      scrollY: 0,
      ignoreElements: function (element) {
        return 'mapWrapper' === element.id;
      }
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm');
      pdf.setFontSize(18);
      pdf.text('Crossfeed Report', 12, 10);
      pdf.setFontSize(10);
      pdf.text(dateTimeNow.toISOString(), 12, 17);
      pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, imgHeight); // charts
      pdf.line(3, 290, 207, 290);
      pdf.setFontSize(8);
      pdf.text('Prepared by ' + user?.fullName + ', ' + localDate, 3, 293); // print the name of the person who printed the report as well as a human friendly date/time
      pdf.save('Crossfeed_Report_' + dateTimeNow.toISOString() + '.pdf'); // sets the filename and adds the date and time
    });
    input.style.removeProperty('width');
    setIsLoading(false);
  };

  return (
    <div className={classes.root}>
      {isLoading && (
        <div className="cisa-crossfeed-loading">
          <div></div>
          <div></div>
        </div>
      )}
      <p>
        <USWDSButton
          outline
          type="button"
          onClick={() => {
            generatePDF();
          }}
        >
          Generate Report
        </USWDSButton>
      </p>
      <div id="wrapper" className={cardClasses.contentWrapper}>
        {stats && (
          <div className={cardClasses.content}>
            <div className={cardClasses.panel}>
              <VulnerabilityCard
                title={'Latest Vulnerabilities'}
                data={latestVulnsGroupedArr}
                showLatest={true}
                showCommon={false}
              ></VulnerabilityCard>
              {stats.domains.services.length > 0 && (
                <VulnerabilityPieChart
                  title={'Most common services'}
                  data={stats.domains.services}
                  colors={allColors}
                  type={'services'}
                />
              )}
              {stats.domains.ports.length > 0 && (
                <Paper elevation={0} className={cardClasses.cardRoot}>
                  <div className={cardClasses.cardSmall}>
                    <div className={cardClasses.header}>
                      <h2>Most common ports</h2>
                    </div>
                    <div className={cardClasses.chartSmall}>
                      <VulnerabilityBarChart
                        data={stats.domains.ports.slice(0, 5).reverse()}
                        type={'ports'}
                        xLabels={['Port']}
                      />
                    </div>
                  </div>
                </Paper>
              )}
              {stats.vulnerabilities.severity.length > 0 && (
                <VulnerabilityPieChart
                  title={'Severity Levels'}
                  data={stats.vulnerabilities.severity}
                  colors={getSeverityColor}
                  type={'vulns'}
                />
              )}
            </div>

            <div className={cardClasses.panel}>
              <Paper elevation={0} className={cardClasses.cardRoot}>
                <div>
                  {stats.domains.numVulnerabilities.length > 0 && (
                    <div className={cardClasses.cardBig}>
                      <div className={cardClasses.seeAll}>
                        <h4>
                          <Link to="/inventory/vulnerabilities">See All</Link>
                        </h4>
                      </div>
                      <div className={cardClasses.header}>
                        <h2>Open Vulnerabilities by Domain</h2>
                      </div>
                      <div className={cardClasses.chartLarge}>
                        {stats.domains.numVulnerabilities.length === 0 ? (
                          <h3>No open vulnerabilities</h3>
                        ) : (
                          <>
                            <p className={cardClasses.note}>
                              *Top 50 domains with open vulnerabilities
                            </p>
                            <div className={cardClasses.chipWrapper}>
                              {severities.map(
                                (sevFilter: VulnSeverities, i: number) => (
                                  <Chip
                                    key={i}
                                    className={cardClasses.chip}
                                    disabled={sevFilter.disable}
                                    label={sevFilter.label}
                                    onClick={() => {
                                      setLabels(sevFilter.sevList);
                                      setCurrent(1);
                                    }}
                                  ></Chip>
                                )
                              )}
                            </div>
                            <div className={cardClasses.chartHeader}>
                              <h5>Domain&emsp; Breakdown</h5>
                              <h5
                                style={{ textAlign: 'right', paddingLeft: 0 }}
                              >
                                Total
                              </h5>
                            </div>
                            <VulnerabilityBarChart
                              data={stats.domains.numVulnerabilities}
                              xLabels={labels}
                              type={'vulns'}
                              longXValues={true}
                            />
                          </>
                        )}
                      </div>
                      <div className={cardClasses.footer}>
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
                          of{' '}
                          <strong>{domainsWithVulns.toLocaleString()}</strong>
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
                  )}
                </div>
              </Paper>

              <VulnerabilityCard
                title={'Most Common Vulnerabilities'}
                data={stats.vulnerabilities.mostCommonVulnerabilities}
                showLatest={false}
                showCommon={true}
              ></VulnerabilityCard>

              <div id="mapWrapper">
                {(user?.userType === 'globalView' ||
                  user?.userType === 'globalAdmin') &&
                  showMaps && (
                    <>
                      <MapCard
                        title={'State Vulnerabilities'}
                        geoUrl={geoStateUrl}
                        findFn={(geo) =>
                          stats?.vulnerabilities.byOrg.find(
                            (p) => p.label === geo.properties.name
                          )
                        }
                        type={'state'}
                      ></MapCard>
                      <MapCard
                        title={'County Vulnerabilities'}
                        geoUrl={geoStateUrl}
                        findFn={(geo) =>
                          stats?.vulnerabilities.byOrg.find(
                            (p) => p.label === geo.properties.name + ' Counties'
                          )
                        }
                        type={'county'}
                      ></MapCard>
                    </>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Risk;
