import {
  BrowserContext,
  Contest,
  GetContests,
  GetContestsParams,
  GetContestsResult,
  Mycroft,
} from '../@types';
import {BOTTLENECK_SHERLOCK} from '../constants';
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
  };
}

