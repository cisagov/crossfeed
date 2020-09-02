import { plainToClass } from 'class-transformer';
import { Domain } from '../../../models';

export default async () => {
  return [
    plainToClass(Domain, {
      name: 'first_file_testdomain1',
      ip: '153.126.148.60',
      organization: '1234'
    }),
    plainToClass(Domain, {
      name: 'first_file_testdomain2',
      ip: '31.134.10.156',
      organization: '1234'
    }),
    plainToClass(Domain, {
      name: 'first_file_testdomain3',
      ip: '153.126.148.60',
      organization: '1234'
    }),
    plainToClass(Domain, {
      name: 'first_file_testdomain4',
      ip: '85.24.146.152',
      organization: '1234'
    }),
    plainToClass(Domain, {
      name: 'first_file_testdomain5',
      ip: '45.79.207.117',
      organization: '1234'
    }),
    plainToClass(Domain, {
      name: 'first_file_testdomain6',
      ip: '156.249.159.119',
      organization: '1234'
    }),
    plainToClass(Domain, {
      name: 'first_file_testdomain7',
      ip: '221.10.15.220',
      organization: '1234'
    }),
    plainToClass(Domain, {
      name: 'first_file_testdomain8',
      ip: '81.141.166.145',
      organization: '1234'
    }),
    plainToClass(Domain, {
      name: 'first_file_testdomain9',
      ip: '24.65.82.187',
      organization: '1234'
    }),
    plainToClass(Domain, {
      name: 'first_file_testdomain10',
      ip: '52.74.149.117',
      organization: '1234'
    }),
    plainToClass(Domain, {
      name: 'first_file_testdomain11',
      ip: '31.134.10.156',
      organization: '1234'
    }),
    plainToClass(Domain, {
      name: 'second_file_testdomain1',
      ip: '1.1.1.1',
      organization: '1234'
    })
  ];
};
