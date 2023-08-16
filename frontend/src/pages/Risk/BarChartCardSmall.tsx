import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Point } from './Risk';
import { useHistory } from 'react-router-dom';
import { getSingleColor } from './utils';

const BarChartCardSmall = (props: {
  data: Point[];
  xLabels: string[];
  type: string;
}) => {
  const history = useHistory();
  const { data, xLabels, type } = props;
  const keys = xLabels;
  const dataVal = data.map((e) => ({ ...e, [xLabels[0]]: e.value })) as any;
  return (
    <ResponsiveBar
      data={dataVal as any}
      keys={keys}
      layers={['grid', 'axes', 'bars', 'markers', 'legends']}
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
        history.push(
          `/inventory?filters[0][field]=services.port&filters[0][values][0]=n_${event.data.label}_n&filters[0][type]=any`
        );
        window.location.reload();
      }}
      padding={0.5}
      colors={getSingleColor}
      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 0,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Count',
        legendPosition: 'middle',
        legendOffset: 40
      }}
      axisLeft={{
        tickSize: 0,
        tickPadding: 20,
        tickRotation: 0,
        legend: 'Port',
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
