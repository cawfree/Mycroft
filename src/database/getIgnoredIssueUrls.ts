import Lokijs from 'lokijs';

import {getIgnoredFindingsCollection} from './getCollection';

export const getIgnoredIssueUrls = async ({
  db,
  watson,
}: {
  readonly db: Lokijs;
  readonly watson: string;
}): Promise<readonly string[]> => {
  return (
    await getIgnoredFindingsCollection({db, watson})
  )
    .chain()
    .data()
    .map(({issueUrl}) => issueUrl);
};

