import classes from './Scans.module.scss';
import React, { useState } from 'react';
import { PrimaryNav, Header } from '@trussworks/react-uswds';
import { useAuthContext } from 'context';
import ScansView from './ScansView';
import ScanTasksView from './ScanTasksView';

export const Scans: React.FC = () => {
  const { user } = useAuthContext();
  const [currentView, setCurrentView] = useState<number>(0);

  const titles = ['Scans', 'Scan Tasks'];

  const views = [<ScansView />, <ScanTasksView />];

  return (
    <div className={classes.root}>
      <Header>
        <div>
          {user?.userType === 'globalView' ||
            (user?.userType === 'globalAdmin' && (
              <PrimaryNav
                items={[
                  <a
                    key="one"
                    href="# "
                    onClick={() => {
                      setCurrentView(0);
                    }}
                    className="usa-nav__link"
                  >
                    <span>Scans</span>
                  </a>,
                  <a
                    key="two"
                    href="# "
                    onClick={() => {
                      setCurrentView(1);
                    }}
                  >
                    <span>Scan Tasks</span>
                  </a>
                ]}
                onToggleMobileNav={function noRefCheck() {}}
              />
            ))}
        </div>
      </Header>
      {views[currentView]}
    </div>
  );
};

export default Scans;
