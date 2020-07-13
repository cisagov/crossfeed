import { plainToClass } from 'class-transformer';
import { Domain } from '../../../models';

export default async () => {
  return [
    plainToClass(Domain, {
      name: 'www.cisa.gov',
      ip: '104.84.119.215',
      services: [
        {
          port: 80
        },
        {
          port: 443
        }
      ]
    })
  ];
};
