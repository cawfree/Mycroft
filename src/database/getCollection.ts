import Lokijs from 'lokijs';

export const getCollection = async ({
  collectionName,
  db,
  unique,
}: {
  readonly collectionName: string;
  readonly db: Lokijs;
  readonly unique: string;
}) => new Promise<Lokijs.Collection>(
  resolve =>  {
    const collection = db.getCollection(collectionName);

    if (collection) return resolve(collection);
    
    return resolve(
      db.addCollection(
        collectionName,
        {
          unique: [unique],
          indices: [unique],
          autoupdate: true,
        },
      )
    );
  },
);

export const getContestsCollection = ({
  db,
  watson,
}: {
  readonly db: Lokijs;
  readonly watson: string;
}) => getCollection({
  db,
  collectionName: `contests-${watson}`,
  unique: 'contestPageUrl',
});

export const getFindingsCollection = ({
  db,
  watson,
}: {
  readonly db: Lokijs;
  readonly watson: string;
}) => getCollection({
  db,
  collectionName: `findings-${watson}`,
  unique: 'issueUrl',
});

export const getIgnoredFindingsCollection = ({
  db,
  watson,
}: {
  readonly db: Lokijs;
  readonly watson: string;
}) => getCollection({
  db,
  collectionName: `ignored-findings-${watson}`,
  unique: 'issueUrl',
});

