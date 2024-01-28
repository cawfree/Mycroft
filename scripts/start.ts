import Lokijs from 'lokijs';

import {
  createMycroft,
  createServer,
  createViewer,
  getContestsCollection,
  getFindingsCollection,
} from '../src';

void (async () => {
  try {

    const port = 3000;
    const watson = 'cawfree';
    const waitUntil = 240;
    const executablePath = '';

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

    const db_contests = await getContestsCollection({db, watson});
    const db_findings = await getFindingsCollection({db, watson});

    const {getContests, getFindings, close} = await createMycroft({
      executablePath,
    });

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

    await Promise.all([
      createServer({db, watson, port}),
      createViewer({
        db,
        executablePath,
        port,
        watson,
      }),
    ]);

  } catch (e) {
    console.error(e);
  }

})();
