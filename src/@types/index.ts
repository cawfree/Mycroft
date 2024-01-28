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
  readonly waitUntil: number;
  readonly watson: string;
};

export type GetContestsResult = {
  readonly contests: readonly Contest[];
};

export type GetContests = (params: GetContestsParams) => Promise<GetContestsResult>;

export type Finding = {
  readonly issueUrl: string;
};

export type GetFindingsParams = {
  readonly contest: Contest;
  readonly waitUntil: number;
};

export type GetFindingsResult = {
  readonly findings: readonly Finding[];
};

export type GetFindings = (params: GetFindingsParams) => Promise<GetFindingsResult>;

export type Mycroft = Omit<StealthBrowserContext, 'browserContext'> & {
  readonly getContests: GetContests;
  readonly getFindings: GetFindings;
};

