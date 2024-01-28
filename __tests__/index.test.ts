import 'jest';

import {Contest, createMycroft} from '../src';

jest.setTimeout(10 * 60 * 1_000);

const createTestMycroft = () => createMycroft({
  headless: false,
});

describe('jest', () => {

  it('getContests', async () => {
    
    const {close, getContests} = await createTestMycroft();

    /// @dev Note, this will get invalidated as the user participates
    ///      in more contests. You'll probably need to update snapshots
    //       frequently with a call to `yarn test -u`.
    expect(await getContests({watson: 'cawfree'})).toMatchSnapshot();

    await close();

  });

  it('getFindings', async () => {

    const {close, getFindings} = await createTestMycroft();

    const contest: Contest = /* first */ {
      contestPageUrl: 'https://audits.sherlock.xyz/contests/122',
      issueRepoUrl: 'https://github.com/sherlock-audit/2023-10-looksrare-judging/issues',
    };

    expect(await getFindings({contest, waitUntil: 240})).toMatchSnapshot();

    await close();

  });


});

