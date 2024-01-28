import Lokijs from 'lokijs';

import {Finding} from '../@types';

import {
  getFindingsCollection,
} from './getCollection';
import {
  getIgnoredIssueUrls,
} from './getIgnoredIssueUrls';

export const getRandomFinding = async ({
  db,
  watson,
}: {
  readonly db: Lokijs;
  readonly watson: string;
}): Promise<Finding | null> => {

  const ignoredIssueUrls = await getIgnoredIssueUrls({db, watson});

  /// @dev Re-read every time since the database contents
  /// will change at runtime.
  const findings = (
    await getFindingsCollection({db, watson})
  )
    .chain()
    .where((finding: Finding) => !ignoredIssueUrls.includes(finding.issueUrl))
    .data();

  return findings[Math.floor(findings.length * Math.random())] || null;

};
