import 'jest';

import {createMycroft} from '../src';

jest.setTimeout(10 * 60 * 1_000);

const createTestMycroft = () => createMycroft({
  headless: false,
});

describe('jest', () => {

  it('get contest urls', async () => {
    
    const {close, getContests} = await createTestMycroft();

    /// @dev Note, this will get invalidated as the user participates
    ///      in more contests. You'll probably need to update snapshots
    //       frequently with a call to `yarn test -u`.
    expect(await getContests({watson: 'cawfree'})).toMatchSnapshot();

    await close();

  });

});

