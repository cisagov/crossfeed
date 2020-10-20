import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper,
  makeStyles,
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Collapse
} from '@material-ui/core';
import {
  ExpandLess,
  ExpandMore,
  Launch as LinkOffIcon
} from '@material-ui/icons';
import { Domain } from 'types';
import { useDomainApi } from 'hooks';
import { DefinitionList } from './DefinitionList';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { stateMap } from 'pages/Vulnerabilities/Vulnerabilities';
import { Webpage } from 'types/webpage';
import { useAuthContext } from 'context';

interface Props {
  domainId: string;
}

export const generateWebpageTree = (pages: Webpage[]) => {
  const tree: any = {};
  for (const page of pages) {
    const url = new URL(page.url);
    const parts = url.pathname.split('/').filter((path) => path !== '');
    let root = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (parts[i] in root) root = root[parts[i]];
      else {
        root[parts[i]] = {};
        root = root[parts[i]];
      }
    }
    root[parts[parts.length - 1]] = page;
  }
  return tree;
};

export const DomainDetails: React.FC<Props> = (props) => {
  const { domainId } = props;
  const { getDomain } = useDomainApi(false);
  const { user } = useAuthContext();
  const [domain, setDomain] = useState<Domain>();
  const classes = useStyles();

  const fetchDomain = useCallback(async () => {
    try {
      setDomain(undefined);
      const result = await getDomain(domainId);
      setDomain(result);
    } catch (e) {
      console.error(e);
    }
  }, [domainId, getDomain]);

  useEffect(() => {
    fetchDomain();
  }, [fetchDomain]);

  const webInfo = useMemo(() => {
    if (!domain) {
      return [];
    }
    const categoriesToProducts: Record<string, Set<string>> = {};
    for (const service of domain.services) {
      for (const product of service.products) {
        const version = product.version ? ` ${product.version}` : '';
        const value = product.name + version;
        const name =
          product.tags && product.tags.length > 0 ? product.tags[0] : 'Misc';
        if (!categoriesToProducts[name]) {
          categoriesToProducts[name] = new Set();
        }
        categoriesToProducts[name].add(value);
      }
    }
    return Object.entries(categoriesToProducts).reduce(
      (acc, [name, value]) => [
        ...acc,
        {
          label: name,
          value: Array.from(value).join(', ')
        }
      ],
      [] as any
    );
  }, [domain]);

  const overviewInfo = useMemo(() => {
    if (!domain) {
      return [];
    }
    const ret = [];
    if (domain.ip) {
      ret.push({
        label: 'IP',
        value: domain.ip
      });
    }
    ret.push({
      label: 'First Seen',
      value: `${formatDistanceToNow(parseISO(domain.createdAt))} ago`
    });
    ret.push({
      label: 'Last Seen',
      value: `${formatDistanceToNow(parseISO(domain.updatedAt))} ago`
    });
    if (domain.country) {
      ret.push({
        label: 'Country',
        value: domain.country
      });
    }
    if (domain.cloudHosted) {
      ret.push({
        label: 'Cloud Hosted',
        value: 'Yes'
      });
    }
    ret.push({
      label: 'Organization',
      value: domain.organization.name
    });
    return ret;
  }, [domain]);

  const [hiddenRows, setHiddenRows] = React.useState<{
    [key: string]: boolean;
  }>({});

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const generateWebpageList = (tree: any, prefix = '') => {
    return (
      <List
        className={`${classes.listRoot}${prefix ? ' ' + classes.nested : ''}`}
      >
        {Object.keys(tree).map((key) => {
          const isWebpage =
            'url' in tree[key] && typeof tree[key]['url'] === 'string';
          if (!isWebpage) {
            let newPrefix = prefix + '/' + key;
            return (
              <>
                <ListItem
                  button
                  onClick={() => {
                    setHiddenRows((hiddenRows: any) => {
                      hiddenRows[newPrefix] =
                        newPrefix in hiddenRows ? !hiddenRows[newPrefix] : true;
                      return { ...hiddenRows };
                    });
                  }}
                  key={newPrefix}
                >
                  <ListItemText primary={(prefix ? '' : '/') + key + '/'} />
                  {hiddenRows[newPrefix] ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse
                  in={!hiddenRows[newPrefix]}
                  timeout="auto"
                  unmountOnExit
                >
                  {generateWebpageList(tree[key], newPrefix)}
                </Collapse>
              </>
            );
          }
          const page = tree[key] as Webpage;
          const parsed = new URL(page.url);
          const split = parsed.pathname
            .replace(/\/$/, "") // Remove trailing slash
            .split('/');
          return (
            <ListItem
              button
              divider={true}
              key={page.url}
              onClick={() => window.open(page.url, '_blank')}
            >
              <ListItemText
                primary={(prefix ? '' : '/') + split.pop()}
                secondary={
                  page.status + ' • ' + formatBytes(page.responseSize ?? 0, 1)
                }
              ></ListItemText>
            </ListItem>
          );
        })}
      </List>
    );
  };

  if (!domain) {
    return null;
  }

  const url =
    (domain.services.find((service) => service.port === 443)
      ? 'https://'
      : 'http://') + domain.name;

  domain.webpages.sort((a, b) => (a.url > b.url ? 1 : -1));
  const webpageTree = generateWebpageTree(domain.webpages);
  const webpageList = generateWebpageList(webpageTree);

  return (
    <Paper classes={{ root: classes.root }}>
      <div className={classes.title}>
        <h4>
          <Link to={`/domain/${domain.id}`}>{domain.name}</Link>
        </h4>

        <a href={url} target="_blank" rel="noopener noreferrer">
          <LinkOffIcon />
        </a>
      </div>
      <div className={classes.inner}>
        {overviewInfo.length > 0 && (
          <div className={classes.section}>
            <h4 className={classes.subtitle}>Overview</h4>
            <DefinitionList items={overviewInfo} />
          </div>
        )}
        {webInfo.length > 0 && (
          <div className={classes.section}>
            <h4 className={classes.subtitle}>Known Products</h4>
            <DefinitionList items={webInfo} />
          </div>
        )}

        {domain.vulnerabilities.length > 0 && (
          <div className={classes.section}>
            <h4 className={classes.subtitle}>Vulnerabilities</h4>
            <Accordion className={classes.accordionHeaderRow} disabled>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography className={classes.accordionHeading}>
                  Title
                </Typography>
                <Typography className={classes.vulnDescription}>
                  Serverity
                </Typography>
                <Typography className={classes.vulnDescription}>
                  State
                </Typography>
                <Typography className={classes.vulnDescription}>
                  Created
                </Typography>
              </AccordionSummary>
            </Accordion>
            {domain.vulnerabilities.map((vuln) => (
              <Accordion className={classes.accordion} key={vuln.id}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography className={classes.accordionHeading}>
                    {vuln.cve}
                  </Typography>
                  <Typography className={classes.vulnDescription}>
                    {vuln.severity}
                  </Typography>
                  <Typography className={classes.vulnDescription}>
                    {vuln.state}
                  </Typography>
                  <Typography className={classes.vulnDescription}>
                    {vuln.createdAt
                      ? `${formatDistanceToNow(parseISO(vuln.createdAt))} ago`
                      : ''}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <DefinitionList
                    items={[
                      {
                        label: 'CVE',
                        value: vuln.cve ?? 'N/A'
                      },
                      {
                        label: 'Severity',
                        value: vuln.severity ?? 'N/A'
                      },
                      {
                        label: 'CVSS',
                        value: vuln.cvss?.toString() ?? 'N/A'
                      },
                      {
                        label: 'CPE',
                        value: vuln.cpe ?? 'N/A'
                      },
                      {
                        label: 'State',
                        value:
                          `${vuln.state} (${stateMap[
                            vuln.substate
                          ].toLowerCase()})` ?? 'N/A'
                      },
                      {
                        label: 'Description',
                        value: vuln.description ?? 'N/A'
                      }
                    ]}
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        )}
        {domain.services.length > 0 && (
          <div className={classes.section}>
            <h4 className={classes.subtitle}>Ports</h4>
            <Accordion className={classes.accordionHeaderRow} disabled>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography className={classes.accordionHeading}>
                  Port
                </Typography>
                <Typography className={classes.accordionHeading}>
                  Products
                </Typography>
                <Typography>Last Seen</Typography>
              </AccordionSummary>
            </Accordion>
            {domain.services.map((service) => {
              const products = service.products
                .map(
                  (product) =>
                    product.name +
                    (product.version ? ` ${product.version}` : '')
                )
                .join(', ');
              return (
                <Accordion className={classes.accordion} key={service.id}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography className={classes.accordionHeading}>
                      {service.port}
                    </Typography>
                    <Typography className={classes.accordionHeading}>
                      {products}
                    </Typography>
                    {service.lastSeen && (
                      <Typography>
                        {formatDistanceToNow(parseISO(service.lastSeen))} ago
                      </Typography>
                    )}
                  </AccordionSummary>
                  {service.products.length > 0 && (
                    <AccordionDetails>
                      <DefinitionList
                        items={[
                          {
                            label: 'Products',
                            value: products
                          },
                          {
                            label: 'Banner',
                            value:
                              (user?.userType === 'globalView' ||
                                user?.userType === 'globalAdmin') &&
                              service.banner
                                ? service.banner
                                : 'None'
                          }
                        ]}
                      />
                    </AccordionDetails>
                  )}
                </Accordion>
              );
            })}
          </div>
        )}
        {domain.webpages.length > 0 && (
          <div className={classes.section}>
            <h4 className={classes.subtitle}>Site Map</h4>
            {webpageList}
          </div>
        )}
      </div>
    </Paper>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    border: `2px solid ${theme.palette.primary.main}`,
    boxShadow: '0px 1px 6px rgba(0, 0, 0, 0.25)',
    marginBottom: '1rem',
    '& *:focus': {
      outline: 'none !important'
    }
  },
  title: {
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    fontSize: '2rem',
    textDecoration: 'none',

    '& > h4': {
      wordBreak: 'break-all',
      paddingRight: '2rem',
      margin: '0'
    },

    '& > a, & > h4 a': {
      color: 'white',
      textDecoration: 'none'
    }
  },
  section: {
    marginBottom: '1.5rem'
  },
  subtitle: {
    margin: 0,
    padding: '0 0 0.2rem 0',
    fontSize: '1.2rem',
    fontWeight: 500,
    color: '#3D4551'
  },
  inner: {
    padding: '1.5rem'
  },
  accordion: {
    color: '#3D4551'
  },
  accordionHeaderRow: {
    color: '#000',
    backgroundColor: '#eaeaea !important'
  },
  accordionHeading: {
    flex: '1 0 33%'
  },
  vulnDescription: {
    flex: '1 1 15%',
    textOverflow: 'hidden',
    textAlign: 'right'
  },
  listRoot: {
    width: '100%',
    backgroundColor: theme.palette.background.paper
  },
  nested: {
    paddingLeft: theme.spacing(2)
  }
}));
