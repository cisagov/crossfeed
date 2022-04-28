import React, { useCallback, useState, useEffect } from 'react';
import classes from './Risk.module.scss';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { useAuthContext } from 'context';
import { makeStyles, Paper, Tooltip, Chip } from '@material-ui/core';
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

export const getSeverityColor = ({ id }: { id: string }) => {
  if (id === 'null' || id === '') return '#EFF1F5';
  else if (id === 'Low') return '#F8DFE2';
  else if (id === 'Medium') return '#F2938C';
  else if (id === 'High') return '#B51D09';
  else return '#540C03';
};

const Risk: React.FC = (props) => {
  const history = useHistory();
  const {
    currentOrganization,
    showAllOrganizations,
    user,
    apiPost
  } = useAuthContext();

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
  const cardClasses = useStyles(props);

  const geoStateUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

  const allColors = ['rgb(0, 111, 162)', 'rgb(0, 185, 227)'];

  const resultsPerPage = 30;

  const getSingleColor = () => {
    return '#FFBC78';
  };

  const truncateText = (text: string, len: number) => {
    if (text.length <= len) return text;
    return text.substring(0, len) + '...';
  };

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

  const MyResponsivePie = ({
    data,
    colors,
    type
  }: {
    data: Point[];
    colors: any;
    type: string;
  }) => {
    return (
      <ResponsivePie
        data={data as any}
        innerRadius={0.5}
        padAngle={0.7}
        arcLabelsSkipAngle={10}
        arcLinkLabelsSkipAngle={10}
        colors={colors}
        margin={{
          left: 30,
          right: 50,
          top: 30,
          bottom: 50
        }}
        onClick={(event) => {
          if (type === 'vulns') {
            history.push(`/inventory/vulnerabilities?severity=${event.id}`);
          }
        }}
      />
    );
  };

  const MyResponsiveBar = ({
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
        data={dataVal}
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
        colors={type === 'ports' ? getSingleColor : getSeverityColor}
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
        motionStiffness={90}
        motionDamping={15}
        layout={'horizontal'}
        enableGridX={true}
        enableGridY={false}
      />
    );
  };

  const VulnerabilityCard = ({
    title,
    showLatest,
    showCommon,
    data
  }: {
    title: string;
    showLatest: boolean;
    showCommon: boolean;
    data: VulnerabilityCount[];
  }) => (
    <Paper elevation={0} className={cardClasses.cardRoot}>
      <div className={cardClasses.cardSmall}>
        {showLatest && (
          <div className={cardClasses.seeAll}>
            <h4>
              <Link to="/inventory/vulnerabilities?sort=createdAt&desc=false">
                See All
              </Link>
            </h4>
          </div>
        )}
        {showCommon && (
          <div className={cardClasses.seeAll}>
            <h4>
              <Link to="/inventory/vulnerabilities/grouped">See All</Link>
            </h4>
          </div>
        )}
        <div className={cardClasses.header}>
          <h2>{title}</h2>
        </div>
        <div className={cardClasses.body}>
          {/* <h4 style={{ float: 'left' }}>Today:</h4> */}
          <div>
            {data.length === 0 && <h3>No open vulnerabilities</h3>}
            {data.length > 0 &&
              data.slice(0, 4).map((vuln) => (
                <Tooltip
                  title={
                    <span style={{ fontSize: 14 }}>
                      {truncateText(vuln.description, 120)}
                    </span>
                  }
                  placement="right"
                  arrow
                  key={vuln.title}
                >
                  <Paper
                    elevation={0}
                    className={cardClasses.miniCardRoot}
                    aria-label="view domain details"
                    onClick={() => {
                      history.push(
                        '/inventory/vulnerabilities?title=' +
                          vuln.title +
                          (vuln.domain ? '&domain=' + vuln.domain.name : '')
                      );
                    }}
                  >
                    <div className={cardClasses.cardInner}>
                      <div className={cardClasses.vulnCount}>{vuln.count}</div>
                      <div className={cardClasses.miniCardLeft}>
                        {vuln.title}
                      </div>
                      <div className={cardClasses.miniCardCenter}>
                        <p
                          className={cardClasses.underlined}
                          style={{
                            borderBottom: `6px solid ${getSeverityColor({
                              id: vuln.severity ?? ''
                            })}`
                          }}
                        >
                          {vuln.severity}
                        </p>
                      </div>
                      <button className={cardClasses.button}>DETAILS</button>
                    </div>
                    {
                      <hr
                        style={{
                          border: '1px solid #F0F0F0',
                          position: 'relative',
                          maxWidth: '90%'
                        }}
                      />
                    }
                  </Paper>
                </Tooltip>
              ))}
          </div>
        </div>
      </div>
    </Paper>
  );

  const offsets: any = {
    Vermont: [50, -8],
    'New Hampshire': [34, 2],
    Massachusetts: [30, -1],
    'Rhode Island': [28, 2],
    Connecticut: [35, 10],
    'New Jersey': [34, 1],
    Delaware: [33, 0],
    Maryland: [47, 10],
    'District of Columbia': [49, 21]
  };

  const MapCard = ({
    title,
    geoUrl,
    findFn,
    type
  }: {
    title: string;
    geoUrl: string;
    findFn: (geo: any) => Point | undefined;
    type: string;
  }) => (
    <Paper elevation={0} classes={{ root: cardClasses.cardRoot }}>
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
      if (
        stats.domains.numVulnerabilities.some((i) =>
          sev.sevList.includes(i.id.split('|')[1])
        )
      ) {
        sev.disable = false;
      } else {
        sev.disable = true;
      }
    }
  }

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const generatePDF = async () => {
    setIsLoading(true);
    const input = document.getElementById('wrapper')!;
    input.style.width = '1400px';
    await delay(1);
    await html2canvas(input, {
      scrollX: 0,
      scrollY: 0,
      ignoreElements: function (element) {
        if ('mapWrapper' === element.id) {
          return true;
        }
        return false;
      }
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm');
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save('Crossfeed_Report.pdf');
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
                <Paper elevation={0} className={cardClasses.cardRoot}>
                  <div className={cardClasses.cardSmall}>
                    <div className={cardClasses.header}>
                      <h2>Most common services</h2>
                    </div>
                    <div className={cardClasses.chartSmall}>
                      <MyResponsivePie
                        data={stats.domains.services}
                        colors={allColors}
                        type={'services'}
                      />
                    </div>
                  </div>
                </Paper>
              )}
              {stats.domains.ports.length > 0 && (
                <Paper elevation={0} classes={{ root: cardClasses.cardRoot }}>
                  <div className={cardClasses.cardSmall}>
                    <div className={cardClasses.header}>
                      <h2>Most common ports</h2>
                    </div>
                    <div className={cardClasses.chartSmall}>
                      <MyResponsiveBar
                        data={stats.domains.ports.slice(0, 5).reverse()}
                        type={'ports'}
                        xLabels={['Port']}
                      />
                    </div>
                  </div>
                </Paper>
              )}
              {stats.vulnerabilities.severity.length > 0 && (
                <Paper elevation={0} classes={{ root: cardClasses.cardRoot }}>
                  <div className={cardClasses.cardSmall}>
                    <div className={cardClasses.header}>
                      <h2>Severity Levels</h2>
                    </div>
                    <div className={cardClasses.chartSmall}>
                      <MyResponsivePie
                        data={stats.vulnerabilities.severity}
                        colors={getSeverityColor}
                        type={'vulns'}
                      />
                    </div>
                  </div>
                </Paper>
              )}
            </div>

            <div className={cardClasses.panel}>
              <Paper elevation={0} classes={{ root: cardClasses.cardRoot }}>
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
                            <MyResponsiveBar
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
                  user?.userType === 'globalAdmin') && (
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

const useStyles = makeStyles((theme) => ({
  cardRoot: {
    boxSizing: 'border-box',
    marginBottom: '1rem',
    border: '2px solid #DCDEE0',
    boxShadow: 'none',
    '& em': {
      fontStyle: 'normal',
      backgroundColor: 'yellow'
    }
  },
  cardSmall: {
    width: '100%',
    height: '355px',
    '& h3': {
      textAlign: 'center'
    },
    overflow: 'hidden'
  },
  chartSmall: {
    height: '85%'
  },
  chartLarge: {
    height: '85.5%',
    width: '90%'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    '& h5': {
      paddingLeft: 190,
      color: '#71767A',
      margin: '10px 0 0 0',
      fontSize: 14
    }
  },
  cardBig: {
    width: '100%',
    height: '889px',
    '& h3': {
      textAlign: 'center'
    },
    overflow: 'hidden'
  },
  body: {
    padding: '20px 30px'
  },
  header: {
    height: '60px',
    backgroundColor: '#F8F9FA',
    top: 0,
    width: '100%',
    color: '#07648D',
    fontWeight: 'bold',
    paddingLeft: 20,
    paddingTop: 1
  },
  footer: {
    height: '60px',
    backgroundColor: '#F8F9FA',
    width: '100%',
    color: '#3D4551',
    paddingLeft: 255,
    paddingTop: 20,
    display: 'flex',
    alignItems: 'center',
    padding: '1rem 2rem',
    '& > span': {
      marginRight: '2rem'
    },
    '& *:focus': {
      outline: 'none !important'
    }
  },
  seeAll: {
    float: 'right',
    marginTop: '5px',
    marginRight: '20px',
    '& h4 a': {
      color: '#71767A',
      fontSize: '12px',
      fontWeight: '400'
    }
  },
  root: {
    position: 'relative',
    flex: '1',
    width: '100%',
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    margin: '0',
    overflowY: 'hidden'
  },
  contentWrapper: {
    position: 'relative',
    flex: '1 1 auto',
    height: '100%',
    display: 'flex',
    flexFlow: 'column nowrap',
    overflowY: 'hidden',
    marginTop: '1rem'
  },
  content: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    flex: '1'
  },
  panel: {
    position: 'relative',
    height: '100%',
    overflowY: 'auto',
    padding: '0 1rem 2rem 1rem',
    flex: '0 0 50%'
  },
  miniCardRoot: {
    boxSizing: 'border-box',
    marginBottom: '1rem',
    '& em': {
      fontStyle: 'normal',
      backgroundColor: 'yellow'
    },
    '&:hover': {
      background: '#FCFCFC',
      boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.15)',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    '&:last-child hr': {
      display: 'none'
    },
    height: 45,
    width: '100%',
    borderRadius: '4px'
  },
  cardInner: {
    paddingLeft: 30,
    paddingRight: 30,
    display: 'flex',
    alignItems: 'center',
    '& div': {
      display: 'inline',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    '& button': {
      justifyContent: 'flex-end'
    },
    height: 45
  },
  miniCardLeft: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-start',
    color: '#3D4551'
  },
  miniCardCenter: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center'
  },
  button: {
    outline: 'none',
    border: 'none',
    background: 'none',
    color: '#07648D',
    margin: '0 0.2rem',
    cursor: 'pointer',
    fontSize: '12px'
  },
  underlined: {
    width: '80px',
    fontWeight: 'normal'
  },
  vulnCount: {
    color: '#B51D09',
    flex: 0.5
  },
  chip: {
    color: '#3D4551',
    height: '26px',
    fontSize: '12px',
    textAlign: 'center',
    background: '#FFFFFF',
    border: '1px solid #DCDEE0',
    boxSizing: 'border-box',
    borderRadius: '22px',
    marginRight: '10px',
    '&:hover': {
      background: '#F8DFE2',
      border: '1px solid #D75B57'
    },
    '&:focus': {
      background: '#F8DFE2',
      border: '1px solid #D75B57',
      outline: 0
    },
    '&:default': {
      background: '#F8DFE2',
      border: '1px solid #D75B57',
      outline: 0
    }
  },
  chipWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: '5px 10px',
    marginTop: '5px',
    marginLeft: '15px'
  },
  note: {
    font: '12px',
    fontFamily: 'Public Sans',
    margin: '10px 10px 10px 25px',
    fontStyle: 'italic',
    color: '#71767A'
  }
}));
