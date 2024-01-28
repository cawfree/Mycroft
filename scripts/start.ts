import 'dotenv/config';

import Lokijs from 'lokijs';

import {
  createMycroft,
  createViewer,
  getContestsCollection,
  getFindingsCollection,
} from '../src';

const {
  CHROMIUM_PATH: maybeChromiumPath,
  LOAD_DELAY: maybeLoadDelay,
} = process.env as Partial<{
  readonly CHROMIUM_PATH: string;
  readonly LOAD_DELAY: string;
}>;

const executablePath = typeof maybeChromiumPath === 'string' && maybeChromiumPath.length > 0
  ? maybeChromiumPath
  : '';

const waitUntil = typeof maybeLoadDelay === 'string' && String(parseInt(maybeLoadDelay)) === maybeLoadDelay
  ? parseInt(maybeLoadDelay)
  : 240;


void (async () => {
  try {

    const [maybeWatson] = process.argv.slice(2);
    
    if (typeof maybeWatson !== 'string' || !maybeWatson.length) {
      console.log(`You must specify a watson i.e. yarn start xiaoming90`);
      return;
    }

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

    const db_contests = await getContestsCollection({db, watson: maybeWatson});
    const db_findings = await getFindingsCollection({db, watson: maybeWatson});

    console.log('Preparing...');

    const {getContests, getFindings, close} = await createMycroft({
      executablePath,
    });

    const {contests} = await getContests({watson: maybeWatson, waitUntil});

    if (!contests.length)
      throw new Error(`Unable to find any contests for "${maybeWatson}".`);


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

    await createViewer({db, executablePath, waitUntil, watson: maybeWatson});

  } catch (e) {
    console.error(e);
  }

})();
