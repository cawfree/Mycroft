import express from 'express';

import {createMycroft} from '../src';

void (async () => {
  try {

    const port = 3000;
    const watson = 'cawfree';

    console.log('Preparing Mycroft...');

    const {getContests, getFindings, close} = await createMycroft();

    console.log(`Fetching ${watson}'s contest history...`);

    const {contests} = await getContests({watson});

    if (!contests.length)
      throw new Error(`Unable to find any contests for "${watson}".`);

    console.log(`Found ${contests.length} contests.`);

    console.log('Recovering contest issues. Please be patient.');

    /// @dev Although this looks like it could be high-overhead,
    /// it isn't. Per-resource requests are throttled internally.
    const allFindings = (
      await Promise.all(
        contests.map(contest => getFindings({
          contest,
          waitUntil: 240,
        }))
      )
    )
      .flatMap(({findings}) => findings);

    const allFindingsWatsonDidNotDiscover = allFindings
      .filter(e => !e.watsons.includes(watson));

    console.log(
      `Discovered a total of ${
        allFindings.length
      } findings, out of which ${
        watson
      } failed to discover ${
        allFindingsWatsonDidNotDiscover.length
      } (${
       Math.round((allFindingsWatsonDidNotDiscover.length / allFindings.length) * 10_000) / 100
      }%).`
    );

    await close();

    console.log(`Server launched on http://localhost:${port}!`);

    await new Promise<void>(
      resolve => express()
        .get('/', (req, res) => res.status(200).send('hello'))
        .get(
          '/random',
          (_, res) => res
            .status(200)
            .json(
              allFindingsWatsonDidNotDiscover[
                Math.floor(allFindingsWatsonDidNotDiscover.length * Math.random())
              ]
            )
        )
        .listen(port, resolve)
    );

  } catch (e) {
    console.error(e);
  }

})();
