import Lokijs from 'lokijs';
import {Page} from 'puppeteer-core';

import {BrowserContext, Finding as IgnoredFinding} from '../@types';
import {
  getRandomFinding,
  getIgnoredFindingsCollection,
  getIgnoredIssueUrls,
} from '../database';
import {createStealthBrowserContext} from '../puppeteer';

const NAVIGATE_RANDOMIZE = 'https://github.com/git-guides?mycroft_randomize=1';
const NAVIGATE_IGNORE = 'https://github.com/git-guides?mycroft_ignore=1';

const CONTENT_HEIGHT = '30px';
const TEXT_HEIGHT = '20px';

const createBanner = ({
  watson,
}: {
  readonly watson: string;
}) => `
  <div
    class="sticky-bottom"
    style="display: flex; flex-direction: row; align-items: center; position: fixed; bottom: 0; width: 100%; padding: 15px; box-sizing: border-box; z-index: 999; background: linear-gradient(#6C0CC4, #280548);">
    <a href="https://audits.sherlock.xyz">
      <img src="https://avatars.githubusercontent.com/u/112079356?s=200&v=4" alt="Randomize" style="width: ${CONTENT_HEIGHT}; height: ${CONTENT_HEIGHT};"></img>
    </a>
    <a href="https://audits.sherlock.xyz/watson/${watson}" style="margin-left: 10px; color: white; margin-top: -8px; font-size: ${TEXT_HEIGHT}; line-height: ${TEXT_HEIGHT};" alt="View Profile">
      <span style="style=margin-left: 10px;">
        ${watson}
      </span>
    </a>
    <div style="flex: 1;"></div>
    <a href="${NAVIGATE_IGNORE}" style="margin-right: 10px;" alt="Ignore Issue">
      <svg xmlns="http://www.w3.org/2000/svg" fill="#FFFFFF" width="${CONTENT_HEIGHT}" height="${CONTENT_HEIGHT}" viewBox="0 0 32 32" version="1.1">
        <path d="M16 29c-7.18 0-13-5.82-13-13s5.82-13 13-13 13 5.82 13 13-5.82 13-13 13zM16 6c-5.522 0-10 4.478-10 10s4.478 10 10 10c5.523 0 10-4.478 10-10s-4.477-10-10-10zM20.537 19.535l-1.014 1.014c-0.186 0.186-0.488 0.186-0.675 0l-2.87-2.87-2.87 2.87c-0.187 0.186-0.488 0.186-0.675 0l-1.014-1.014c-0.186-0.186-0.186-0.488 0-0.675l2.871-2.869-2.871-2.87c-0.186-0.187-0.186-0.489 0-0.676l1.014-1.013c0.187-0.187 0.488-0.187 0.675 0l2.87 2.87 2.87-2.87c0.187-0.187 0.489-0.187 0.675 0l1.014 1.013c0.186 0.187 0.186 0.489 0 0.676l-2.871 2.87 2.871 2.869c0.186 0.187 0.186 0.49 0 0.675z"/>
        </svg>
    </a>
    <a href="${NAVIGATE_RANDOMIZE}" alt="Skip Issue">
      <svg xmlns="http://www.w3.org/2000/svg" width="${CONTENT_HEIGHT}" height="${CONTENT_HEIGHT}" viewBox="0 0 24 24" fill="none">
        <path d="M18 20L21 17M21 17L18 14M21 17H17C14.2386 17 12 14.7614 12 12C12 9.23858 9.76142 7 7 7H3M18 4L21 7M21 7L18 10M21 7L17 7C15.8744 7 14.8357 7.37194 14 7.99963M3 17H7C8.12561 17 9.16434 16.6277 10 16" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </a>
  </div>
`.trim();

const removeElement = async ({
  id,
  className,
  page,
}: {
  readonly id?: string;
  readonly className?: string;
  readonly page: Page;
}) => page.evaluate(
  (maybeClassName: string | null, maybeId: string | null) => {

    if (typeof id === 'string') {
      const element = document.getElementById(id);

      console.log('found by id?', element);

      element && element.parentNode?.removeChild?.(element);
    }

    if (typeof maybeClassName === 'string') 
      for (const element of Array.from(document.getElementsByClassName(maybeClassName)))
        element.parentNode?.removeChild?.(element);

  },
  className || null,
  id || null,
);

export const navigateToRandomFinding = async ({
  currentIssueUrl,
  db,
  page,
  waitUntil,
  watson,
}: {
  readonly currentIssueUrl: string[];
  readonly db: Lokijs;
  readonly page: Page;
  readonly watson: string;
  readonly waitUntil: number;
}) => {

  const maybeRandomFinding = await getRandomFinding({db, watson});

  // We expect at least an initial random finding to begin with.
  if (!maybeRandomFinding)
   throw new Error(`Expected \`Finding\` finding, encountered ${
      typeof maybeRandomFinding
    }.`);
  
  const {issueUrl} = maybeRandomFinding;

  /// @dev Cache the current finding.
  currentIssueUrl[0] = issueUrl;

  try {
    await page.goto(issueUrl);

    await page.waitForTimeout(waitUntil);

    await removeElement({page, className: 'js-header-wrapper'});

    await page.evaluate(banner => document.body.innerHTML += banner, createBanner({watson}));

  } catch (e) {
    console.error(e);
  }

};

export const presentRandomFinding = async ({
  browserContext,
  db,
  waitUntil,
  watson,
}: {
  readonly browserContext: BrowserContext;
  readonly db: Lokijs;
  readonly waitUntil: number;
  readonly watson: string;
}) => {

  const maybeRandomFinding = await getRandomFinding({db, watson});

  // We expect at least an initial random finding to begin with.
  if (!maybeRandomFinding)
    throw new Error(`Expected \`Finding\` finding, encountered ${
      typeof maybeRandomFinding
    }.`);

  const currentIssueUrl: string[] = [maybeRandomFinding.issueUrl];

  await new Promise(resolve => setTimeout(resolve, 1000));

  const page = await browserContext.newPage();

  const shouldNavigateToRandomFinding = () => navigateToRandomFinding({
    currentIssueUrl,
    db,
    page,
    waitUntil,
    watson,
  });

  await page.on('framenavigated', async (frame) => {

    if (frame.url() === NAVIGATE_RANDOMIZE) {

      await shouldNavigateToRandomFinding();

    } else if (frame.url() === NAVIGATE_IGNORE) {

      const [issueUrl] = currentIssueUrl;
      const ignoredIssueUrls = await getIgnoredIssueUrls({db, watson});

      /// @dev If we haven't ignored this issue before,
      /// let's ignore it.
      if (!ignoredIssueUrls.includes(issueUrl!)) {

        // Prevent the current issue from being presented again.
        const db_ignored = await getIgnoredFindingsCollection({db, watson});

        const ignoredFinding: IgnoredFinding = {
          issueUrl: issueUrl!,
        };

        await db_ignored.insert(ignoredFinding);
        await db.saveDatabase();

      }

      await shouldNavigateToRandomFinding();

    }
  });

  await shouldNavigateToRandomFinding();

};

export const createViewer = async ({
  db,
  executablePath,
  port,
  waitUntil,
  watson,
}: {
  readonly db: Lokijs,
  readonly executablePath: string;
  readonly port: number;
  readonly waitUntil: number;
  readonly watson: string;
}) => {
  const {browserContext} = await createStealthBrowserContext({
    executablePath,
    headless: false,
  });

  return presentRandomFinding({
    browserContext,
    db,
    waitUntil,
    watson,
  });
};

