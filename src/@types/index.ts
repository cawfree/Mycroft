import {Browser} from 'puppeteer-core';

export type BrowserContext = Awaited<ReturnType<Browser['createIncognitoBrowserContext']>>;

export type StealthBrowserContext = {
  readonly browserContext: BrowserContext;
  readonly close: () => Promise<void>;
};

export type Contest = {
  readonly contestPageUrl: string;
  readonly issueRepoUrl: string;
};

export type GetContestsParams = {
  readonly watson: string;
};

export type GetContestsResult = {
  /// @dev The contests a Watson has participated in.
  readonly contests: readonly Contest[];
};

export type GetContests = (params: GetContestsParams) => Promise<GetContestsResult>;

export type Mycroft = Omit<StealthBrowserContext, 'browserContext'> & {
  readonly getContests: GetContests;
};

