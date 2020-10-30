import React, { useCallback, useState, useEffect } from 'react';
import classes from './Risk.module.scss';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { useAuthContext } from 'context';
import { Checkbox, Grid } from '@trussworks/react-uswds';
import { Chip, makeStyles, Paper, Tooltip } from '@material-ui/core';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Link, useHistory } from 'react-router-dom';
import { Vulnerability } from 'types';

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

// Color Scale used for map
let colorScale = scaleLinear<string>()
  .domain([0, 1])
  .range(['#c7e8ff', '#135787']);

const Risk: React.FC = (props) => {
  const history = useHistory();
  const { currentOrganization, user, apiPost } = useAuthContext();

  const [stats, setStats] = useState<Stats | undefined>(undefined);
  const [showAll, setShowAll] = useState<boolean>(
    JSON.parse(localStorage.getItem('showGlobal') ?? 'false')
  );
  const cardClasses = useStyles(props);

  const updateShowAll = (state: boolean) => {
    setShowAll(state);
    localStorage.setItem('showGlobal', JSON.stringify(state));
  };

  const geoStateUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';
  const geoCountyUrl =
    'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json';

  const allColors = ['rgb(0, 111, 162)', 'rgb(0, 185, 227)'];

  const getSingleColor = () => {
    return '#FFBC78';
  };

  const getSeverityColor = ({ id }: { id: string }) => {
    if (id === 'None') return 'rgb(255, 255, 255)';
    else if (id === 'Low') return '#F8DFE2';
    else if (id === 'Medium') return '#F2938C';
    else if (id === 'High') return '#B51D09';
    else return '#540C03';
  };

  const truncateText = (text: string, len: number) => {
    if (text.length <= len) return text;
    return text.substring(0, len) + '...';
  };

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
    const max = Math.max(...result.vulnerabilities.byOrg.map((p) => p.value));
    // Adjust color scale based on highest count
    colorScale = scaleLinear<string>()
      .domain([0, Math.log(max)])
      .range(['#c7e8ff', '#135787']);
    setStats(result);
  }, [showAll, apiPost, currentOrganization]);

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
        radialLabelsSkipAngle={10}
        slicesLabelsSkipAngle={10}
        colors={colors}
        margin={{
          left: 30,
          right: 50,
          top: 30,
          bottom: 50
        }}
        onClick={(event) => {
          if (type === 'vulns') {
            history.push(`/vulnerabilities?severity=${event.id}`);
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
    let keys = xLabels;
    let dataVal: object[];
    if (type === 'ports') {
      dataVal = data.map((e) => ({ ...e, [xLabels[0]]: e.value })) as any;
    } else {
      // Separate count by severity
      let domainToSevMap: any = {};
      for (let point of data) {
        let split = point.id.split('|');
        let domain = split[0];
        let severity = split[1];
        if (!(domain in domainToSevMap)) domainToSevMap[domain] = {};
        domainToSevMap[domain][severity] = point.value;
      }
      dataVal = Object.keys(domainToSevMap)
        .map((key) => ({
          label: key,
          ...domainToSevMap[key]
        }))
        .sort((a, b) => {
          let diff = 0;
          for (var label of xLabels) {
            diff += (label in b ? b[label] : 0) - (label in a ? a[label] : 0);
          }
          return diff;
        })
        .slice(0, 15)
        .reverse();
    }
    return (
      <ResponsiveBar
        data={dataVal}
        keys={keys}
        indexBy="label"
        margin={{
          top: 0,
          right: 30,
          bottom: longXValues ? 100 : 40,
          left: longXValues ? 200 : 60
        }}
        onClick={(event) => {
          if (type === 'vulns') {
            history.push(
              `/vulnerabilities?domain=${event.data.label}&severity=${event.id}`
            );
          }
        }}
        padding={0.5}
        colors={type === 'ports' ? getSingleColor : getSeverityColor}
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: type === 'ports' ? 'Count' : '',
          legendPosition: 'middle',
          legendOffset: 0
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: type === 'ports' ? 'Port' : '',
          legendPosition: 'middle',
          legendOffset: -40
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        animate={true}
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
    data
  }: {
    title: string;
    showLatest: boolean;
    data: VulnerabilityCount[];
  }) => (
    <Paper elevation={0} className={cardClasses.cardRoot}>
      <div className={cardClasses.cardSmall}>
        <div className={cardClasses.header}>
          <h2>{title}</h2>
        </div>
        <div className={cardClasses.body}>
          {/* <h4 style={{ float: 'left' }}>Today:</h4> */}
          <div>
            {data.slice(0, 4).map((vuln) => (
              <Tooltip
                title={truncateText(vuln.description, 120)}
                placement="right"
                arrow
              >
                <Paper
                  elevation={0}
                  className={cardClasses.miniCardRoot}
                  aria-label="view domain details"
                >
                  <div className={cardClasses.cardInner}>
                    <div className={cardClasses.miniCardLeft}>
                      <p>
                        <Chip
                          label={vuln.count}
                          style={{
                            marginRight: 10,
                            color: '#D83933',
                            backgroundColor: 'white',
                            border: '1px solid #71767A'
                          }}
                        />
                        {vuln.title}
                      </p>
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
                    <button
                      className={cardClasses.button}
                      onClick={() => {
                        history.push(
                          '/vulnerabilities?title=' +
                            vuln.title +
                            (vuln.domain ? '&domain=' + vuln.domain.name : '')
                        );
                      }}
                    >
                      DETAILS
                    </button>
                  </div>
                </Paper>
              </Tooltip>
            ))}
          </div>

          {showLatest && (
            <div className={cardClasses.footer}>
              <h4>
                <Link to="/vulnerabilities?sort=createdAt&desc=false">
                  See all latest vulnerabilites
                </Link>
              </h4>
            </div>
          )}
        </div>
      </div>
    </Paper>
  );

  const MapCard = ({
    title,
    geoUrl,
    findFn
  }: {
    title: string;
    geoUrl: string;
    findFn: (geo: any) => Point | undefined;
  }) => (
    <Paper elevation={0} classes={{ root: cardClasses.cardRoot }}>
      <div className={cardClasses.inner}>
        <div className={classes.chart}>
          <div className={cardClasses.header}>
            <h2>{title}</h2>
          </div>

          <ComposableMap
            projection="geoAlbersUsa"
            style={{
              width: '70%',
              display: 'block',
              margin: 'auto'
            }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const cur = findFn(geo);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={colorScale(cur ? Math.log(cur.value) : 0)}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
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

  return (
    <div className={classes.root}>
      <Grid row>
        <Grid style={{ float: 'right' }}>
          {((user?.roles && user.roles.length > 1) ||
            user?.userType === 'globalView' ||
            user?.userType === 'globalAdmin') && (
            <Checkbox
              id="showAll"
              name="showAll"
              label="Show all organizations"
              checked={showAll}
              onChange={(e) => updateShowAll(e.target.checked)}
              className={classes.showAll}
            />
          )}
        </Grid>
      </Grid>

      <div className={cardClasses.contentWrapper}>
        {stats && (
          <div className={cardClasses.content}>
            <div className={cardClasses.panel}>
              <VulnerabilityCard
                title={'Latest Vulnerabilities'}
                data={latestVulnsGroupedArr}
                showLatest={true}
              ></VulnerabilityCard>
              {/* <Paper elevation={0} classes={{ root: cardClasses.cardRoot }}>
                <div className={cardClasses.inner}>
                  {stats.domains.numVulnerabilities.length > 0 && (
                    <div className={cardClasses.cardSmall}>
                      <div className={cardClasses.header}>
                        <h2>Latest Feeds</h2>
                      </div>
                    </div>
                  )}
                </div>
              </Paper> */}

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
                <div className={cardClasses.inner}>
                  {stats.domains.numVulnerabilities.length > 0 && (
                    <div className={cardClasses.cardBig}>
                      <div className={cardClasses.header}>
                        <h2>Open Vulnerabilities by Domain</h2>
                      </div>
                      <div className={cardClasses.chartLarge}>
                        <MyResponsiveBar
                          data={stats.domains.numVulnerabilities}
                          xLabels={['Critical', 'High', 'Medium', 'Low']}
                          type={'vulns'}
                          longXValues={true}
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
              ></VulnerabilityCard>

              {user?.userType === 'globalView' ||
                (user?.userType === 'globalAdmin' && (
                  <>
                    <MapCard
                      title={'Vulnerabilities by State'}
                      geoUrl={geoStateUrl}
                      findFn={(geo) =>
                        stats?.vulnerabilities.byOrg.find(
                          (p) => p.label === geo.properties.name
                        )
                      }
                    ></MapCard>
                    <MapCard
                      title={'Vulnerabilities by County'}
                      geoUrl={geoCountyUrl}
                      findFn={(geo) =>
                        stats?.domains.numVulnerabilities.find((p) =>
                          p.label.includes(geo.properties.name.toLowerCase())
                        )
                      }
                    ></MapCard>
                  </>
                ))}
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
    height: '350px',
    '& h3': {
      textAlign: 'center'
    },
    overflow: 'hidden'
  },
  chartSmall: {
    height: '85%'
  },
  chartLarge: {
    height: '90%',
    width: '90%'
  },
  cardBig: {
    width: '100%',
    height: '700px',
    '& h3': {
      textAlign: 'center'
    },
    overflow: 'hidden'
  },
  body: {
    padding: 20
  },
  header: {
    height: '60px',
    backgroundColor: '#F8F9FA',
    top: 0,
    width: '100%',
    color: '#07648D',
    fontWeight: 500,
    paddingLeft: 20,
    paddingTop: 1
    // fontSize: '20px'
  },
  footer: {
    float: 'right',
    position: 'relative',
    bottom: 20,
    '& h4 a': {
      color: '#71767A',
      fontSize: '14px',
      fontWeight: '400'
    }
  },
  inner: {},
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
    overflowY: 'hidden'
  },
  content: {
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'stretch',
    flex: '1',
    overflowY: 'scroll'
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
    border: '2px solid #DCDEE0',
    '& em': {
      fontStyle: 'normal',
      backgroundColor: 'yellow'
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
      fontSize: '16px',
      fontWeight: '400',
      color: '#3D4551'
    },
    '& button': {
      justifyContent: 'flex-end'
    },
    height: 45
  },
  miniCardLeft: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-start'
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
    color: theme.palette.secondary.main,
    margin: '0 0.2rem',
    cursor: 'pointer'
  },
  underlined: {
    width: '80px'
  }
}));
