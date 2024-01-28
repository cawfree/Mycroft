import Bottleneck from 'bottleneck';

// The maximum number of parallel requests to use
// when querying Sherlock. We ❤️ Sherlock, so we'll
// keep this low.
export const BOTTLENECK_SHERLOCK = new Bottleneck({
  maxConcurrent: 5,
});

