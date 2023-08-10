import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const getSeverityColor = ({ id }: { id: string }) => {
  if (id === 'null' || id === '') return '#EFF1F5';
  else if (id === 'Low') return '#F8DFE2';
  else if (id === 'Medium') return '#F2938C';
  else if (id === 'High') return '#B51D09';
  else return '#540C03';
};

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));