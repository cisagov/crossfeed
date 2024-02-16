import { connectToDatabase, Cpe, Cve } from '../../models';

export default async (cve: Cve, cpeIds: string[]): Promise<string> => {
  await connectToDatabase();
  console.log(`Saving ${cve.name} to database`);
  try {
    const id: string = (
      await Cve.createQueryBuilder()
        .insert()
        .values(cve)
        .returning('id')
        .orUpdate(cveFieldsToUpdate, ['name'], {
          skipUpdateIfNoValuesChanged: true
        })
        .execute()
    ).identifiers[0].id;
    if (id) {
      await Cpe.createQueryBuilder().relation(Cve, 'cpes').of(id).add(cpeIds);
      return id;
    }
    console.log(`${cve.name} is already up to date.`);
    return '';
  } catch (error) {
    console.log(`Error saving ${cve.name} to database: ${error}`);
    return '';
  }
};

const cveFieldsToUpdate = [
  'publishedAt',
  'modifiedAt',
  'status',
  'description',
  'cvssV2Source',
  'cvssV2Type',
  'cvssV2Version',
  'cvssV2VectorString',
  'cvssV2BaseScore',
  'cvssV2BaseSeverity',
  'cvssV2ExploitabilityScore',
  'cvssV2ImpactScore',
  'cvssV3Source',
  'cvssV3Type',
  'cvssV3Version',
  'cvssV3VectorString',
  'cvssV3BaseScore',
  'cvssV3BaseSeverity',
  'cvssV3ExploitabilityScore',
  'cvssV3ImpactScore',
  'cvssV4Source',
  'cvssV4Type',
  'cvssV4Version',
  'cvssV4VectorString',
  'cvssV4BaseScore',
  'cvssV4BaseSeverity',
  'cvssV4ExploitabilityScore',
  'cvssV4ImpactScore',
  'weaknesses',
  'references'
];
