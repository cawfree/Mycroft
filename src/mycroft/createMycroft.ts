import escapeStringRegexp from 'escape-string-regexp';

import {
  BrowserContext,
  Contest,
  GetContests,
  GetContestsParams,
  GetContestsResult,
  Finding,
  GetFindings,
  GetFindingsParams,
  GetFindingsResult,
  Mycroft,
} from '../@types';
import {BOTTLENECK_SHERLOCK, BOTTLENECK_GITHUB} from '../constants';
import {
  createStealthBrowserContext,
  getAllPageLinks,
  openPageAndWaitUntilLoaded,
} from '../puppeteer';

const createGetContests = (browserContext: BrowserContext): GetContests =>
  async ({watson}: GetContestsParams): Promise<GetContestsResult> => {

    const page = await openPageAndWaitUntilLoaded({
      browserContext,
      url: `https://audits.sherlock.xyz/watson/${watson}`,
    });
    
    const contestPageUrls: readonly string[] = (await getAllPageLinks(page))
      .filter(e => /https:\/\/audits\.sherlock\.xyz\/contests\/\d+/.test(e));

    await page.close();

    const contests: readonly Contest[] = (
      await Promise.allSettled(
        contestPageUrls
          .map(
            async contestPageUrl => BOTTLENECK_SHERLOCK.schedule(
              async (): Promise<Contest> => {

                const page = await openPageAndWaitUntilLoaded({browserContext, url: contestPageUrl});

                const [maybeIssueRepoUrl] = (await getAllPageLinks(page)).filter(e => e.endsWith('/issues'));

                if (typeof maybeIssueRepoUrl !== 'string' || !maybeIssueRepoUrl.length)
                  throw new Error(`Was unable to find issues link for "${contestPageUrl}".`);

                await page.close();

                return {
                  contestPageUrl,
                  issueRepoUrl: maybeIssueRepoUrl,
                };

              },
            )
          )
      )
    )
      .flatMap(e => e.status === 'fulfilled' ? [e.value] : []);
 
    return {contests};

  };

const createGetFindings = (browserContext: BrowserContext): GetFindings =>
  async ({contest: {issueRepoUrl: url}, waitUntil}: GetFindingsParams): Promise<GetFindingsResult> => {

    const page = await openPageAndWaitUntilLoaded({
      browserContext,
      url,
      waitUntil,
    });

    const findings: readonly Finding[] = (
      await Promise.allSettled(
        [
          ...new Set(
            (await getAllPageLinks(page))
              .filter(e => new RegExp(`${escapeStringRegexp(url)}\/`).test(e))
          )
        ]
          .map((issueUrl: string): Promise<Finding> => {
            return BOTTLENECK_GITHUB.schedule(
              async () => {
                const page = await openPageAndWaitUntilLoaded({
                  browserContext,
                  url: issueUrl,
                  waitUntil,
                });

                const maybeTitleContents = await page.evaluate(
                  () => Array.from(document.getElementsByClassName('js-issue-title')).map(e => e.textContent),
                );

                const maybeTitles = [
                  ...new Set(
                    maybeTitleContents
                      .flatMap(e => typeof e === 'string' ? [e] : [])
                      .map(e => e.trim())
                  ),
                ];

                if (!maybeTitles.length) throw new Error('Was unable to determine issue title.');

                const maybeIssueContents = await page.evaluate(
                  () => Array.from(document.querySelectorAll('a[data-hovercard-type="issue"]')).map(link => link.textContent)
                );

                const maybeIssues = [
                  ...new Set(
                    maybeIssueContents
                      .flatMap(e => typeof e === 'string' ? [e] : [])
                      .map(e => e.trim())
                  ),
                ];

                const watsons = [
                  ...new Set(
                    [...maybeTitles, ...maybeIssues]
                      .map(e => e.substring(0, e.indexOf('-')).trim())
                  ),
                ]
                  .filter(e => e.length > 0);

                // We must have found a single Watson in order for the
                // scraping process to be have been successful.
                if (!watsons.length)
                  throw new Error(`Was unable to determine watsons for issue "${String(issueUrl)}".`);

                await page.close();

                return {issueUrl, watsons};
              },
            );
            
          })

      )
    )
      .flatMap(e => e.status === 'fulfilled' ? [e.value] : []);

    await page.close();

    return {findings};
  };


export async function createMycroft({
  executablePath = '',
  headless = true,
}: {
  readonly executablePath?: string;
  readonly headless?: boolean;
} = {}): Promise<Mycroft> {

  const {browserContext, close} = await createStealthBrowserContext({
    executablePath,
    headless,
    args: [],
  });

  return {
    close,
    getContests: createGetContests(browserContext),
    getFindings: createGetFindings(browserContext),
  };
}

