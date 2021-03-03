import classes from './Scans.module.scss';
import React from 'react';
import ScansView from './ScansView';
import ScanTasksView from './ScanTasksView';
import { Subnav } from 'components';
import { Switch, Route } from 'react-router-dom';

export const Scans: React.FC = () => {
  return (
    <>
      <Subnav
        items={[
          {
            title: 'Scans',
            path: `/scans`,
            exact: true
          },
          {
            title: 'Scan History',
            path: `/scans/history`,
            exact: true
          }
        ]}
      ></Subnav>
      <div className={classes.root}>
        <Switch>
          <Route path="/scans" exact>
            <ScansView />
          </Route>
          <Route path="/scans/history" exact>
            <ScanTasksView />
          </Route>
        </Switch>
      </div>
    </>
  );
};

export default Scans;
