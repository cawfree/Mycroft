import Lokijs from 'lokijs';

import {Finding} from '../@types';

import {getFindingsCollection} from './getCollection';

export const getRandomFinding = async ({
  db,
  watson,
}: {
  readonly db: Lokijs;
  readonly watson: string;
}): Promise<Finding | null> => {

  /// @dev Re-read every time since the database contents
  // will change at runtime.
  const findings = (
    await getFindingsCollection({db, watson})
  )
    .chain()
    .data();

  return findings[Math.floor(findings.length * Math.random())] || null;
};
