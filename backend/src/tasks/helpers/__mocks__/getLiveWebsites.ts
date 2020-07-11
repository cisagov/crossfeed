import { plainToClass } from 'class-transformer';
import { Domain } from '../../../models';

export default async () => {
  return [plainToClass(Domain, {
    name: "www.cisa.gov",
    services: [
      {
        port: 80
      },
      {
        port: 443
      }
    ]
  })];
}