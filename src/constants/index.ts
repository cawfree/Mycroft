import Bottleneck from 'bottleneck';

// The maximum number of parallel requests to use
// when querying Sherlock. We ❤️ Sherlock, so we'll
// keep this low.
export const MAX_CONCURRENT_SHERLOCK = 3;

// We can probably get away with being a little meaner
// to GitHub. That doesn't mean we love you any less.
export const MAX_CONCURRENT_GITHUB = MAX_CONCURRENT_SHERLOCK * 2;


export const BOTTLENECK_SHERLOCK = new Bottleneck({
  maxConcurrent: MAX_CONCURRENT_SHERLOCK,
});

export const BOTTLENECK_GITHUB = new Bottleneck({
  maxConcurrent: MAX_CONCURRENT_GITHUB,
});

