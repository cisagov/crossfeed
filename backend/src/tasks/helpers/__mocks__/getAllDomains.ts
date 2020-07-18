import { plainToClass } from 'class-transformer';
import { Domain } from '../../../models';

export default async () => {
  return [
    plainToClass(Domain, {
      name: 'testdomain1',
      ip: '153.126.148.60'
    }),
    plainToClass(Domain, {
      name: 'testdomain2',
      ip: '31.134.10.156'
    }),
    plainToClass(Domain, {
      name: 'testdomain3',
      ip: '153.126.148.60'
    }),
    plainToClass(Domain, {
      name: 'testdomain4',
      ip: '85.24.146.152'
    }),
    plainToClass(Domain, {
      name: 'testdomain5',
      ip: '45.79.207.117'
    }),
    plainToClass(Domain, {
      name: 'testdomain6',
      ip: '156.249.159.119'
    }),
    plainToClass(Domain, {
      name: 'testdomain7',
      ip: '221.10.15.220'
    }),
    plainToClass(Domain, {
      name: 'testdomain8',
      ip: '81.141.166.145'
    }),
    plainToClass(Domain, {
      name: 'testdomain9',
      ip: '24.65.82.187'
    }),
    plainToClass(Domain, {
      name: 'testdomain10',
      ip: '52.74.149.117'
    }),
    plainToClass(Domain, {
      name: 'testdomain11',
      ip: '31.134.10.156'
    })
  ];
};
