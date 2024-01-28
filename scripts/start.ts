import express from 'express';
import Lokijs from 'lokijs';

import {createMycroft} from '../src';

const loadOrCreateCollection = async ({
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

void (async () => {
  try {

    const port = 3000;
    const watson = 'cawfree';
    const waitUntil = 240;

    console.log('Starting...');
 
    // To prevent excessive requests and long startup times,
    // we'll intend to only fetch new contests we don't have
    // information about already.
    const db = await new Promise<Lokijs>(
      resolve => {
        const db: Lokijs = new Lokijs('.db.lokijs', {
          autoload: true,
	      autoloadCallback : () => resolve(db),
	      autosave: true,
	      autosaveInterval: 4000
        });
      },
    );

    const db_contests = await loadOrCreateCollection({
      db,
      collectionName: `contests-${watson}`,
      unique: 'contestPageUrl',
    });

    const db_findings = await loadOrCreateCollection({
      db,
      collectionName: `findings-${watson}`,
      unique: 'issueUrl',
    });

    const {getContests, getFindings, close} = await createMycroft();

    const {contests} = await getContests({watson, waitUntil});

    if (!contests.length)
      throw new Error(`Unable to find any contests for "${watson}".`);


    /// @dev Here we're only inteststed in the contests
    /// we've not yet come across.
    const newContests = contests.filter(
      ({contestPageUrl}) =>
        db_contests.find({contestPageUrl: {$eq: contestPageUrl}}).length === 0,
    );

    /// @dev We only need to discover more issues if new contests
    /// have been picked up.
    if (newContests.length) {

      console.log(`Syncing findings for ${newContests.length} contests...`);

      /// @dev Now that we have fetched all the findings, we can
      /// cache these in the database.
      await db_findings.insert(
        (await Promise.all(newContests.map(contest => getFindings({contest, waitUntil}))))
          .flatMap(({findings}) => findings)
      );

      /// @dev Write the `contestsNotSeenBefore` into the database
      /// so we don't attempt to re-fetch, now that we've successfully
      /// acquired the findings.
      await db_contests.insert(newContests);

    }

    await close();
    await db.saveDatabase();

    console.log(`Server launched on http://localhost:${port}!`);

    await new Promise<void>(
      resolve => express()
        .get('/', (req, res) => res.status(200).send('hello'))
        .get(
          '/random',
          (_, res) => {
            const findings = db_findings.chain().data();
            return res
              .status(200)
              .json(findings[Math.floor(findings.length * Math.random())])
          },
        )
        .listen(port, resolve)
    );

  } catch (e) {
    console.error(e);
  }

})();
