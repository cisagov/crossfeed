import { VulnSeverities } from './Risk';

export const resultsPerPage = 30;
export const getSingleColor = () => {
  return '#FFBC78';
};
export const getSeverityColor = ({ id }: { id: string }) => {
  if (id === 'null' || id === '') return '#EFF1F5';
  else if (id === 'Low') return '#F8DFE2';
  else if (id === 'Medium') return '#F2938C';
  else if (id === 'High') return '#B51D09';
  else return '#540C03';
};
export const getCVSSColor = (score: number) => {
  if (!score || score === 0) return ['#EFF1F5', 'NONE'];
  else if (0.1 <= score && score <= 3.9) return ['#99cc33', 'LOW'];
  else if (4 <= score && score <= 6.9) return ['#ffcc00', 'MEDIUM'];
  else if (7 <= score && score <= 8.9) return ['#ff9966', 'HIGH'];
  else if (9 <= score && score <= 10) return ['#ff6254', 'CRITICAL'];
  else return '#540C03';
};
export const offsets: any = {
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

export const sevLabels = ['', 'Low', 'Medium', 'High', 'Critical'];

// Create severity object for Open Vulnerability chips
export const severities: VulnSeverities[] = [
  { label: 'All', sevList: ['', 'Low', 'Medium', 'High', 'Critical'] },
  { label: 'Critical', sevList: ['Critical'] },
  { label: 'High', sevList: ['High'] },
  { label: 'Medium', sevList: ['Medium'] },
  { label: 'Low', sevList: ['Low'] }
];

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
