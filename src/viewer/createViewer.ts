import Lokijs from 'lokijs';
import {Page} from 'puppeteer-core';

import {BrowserContext} from '../@types';
import {getRandomFinding} from '../database';
import {createStealthBrowserContext} from '../puppeteer';

const NAVIGATE_RANDOMIZE = 'https://audits.sherlock.xyz/issues/random';

const BANNER = `
  <div
    class="sticky-bottom"
    style="display: flex; flex-direction: row; align-items: center; position: fixed; bottom: 0; width: 100%; padding: 15px; box-sizing: border-box; z-index: 999; background: linear-gradient(#6C0CC4, #280548);">
    <a href="${NAVIGATE_RANDOMIZE}">
      <img
        id="randomizer"
        src="https://avatars.githubusercontent.com/u/112079356?s=200&v=4" alt="Sherlock" style="width: 50px; height: 50px;">
      </img>
    </a>
    <div style="flex: 1;"></div>
  </div>
`.trim();

export const navigateToRandomFinding = async ({
  db,
  page,
  watson,
}: {
  readonly db: Lokijs;
  readonly page: Page;
  readonly watson: string;
}) => {

  const maybeRandomFinding = await getRandomFinding({db, watson});

  // We expect at least an initial random finding to begin with.
  if (!maybeRandomFinding)
   throw new Error(`Expected \`Finding\` finding, encountered ${
      typeof maybeRandomFinding
    }.`);
  
  const {issueUrl} = maybeRandomFinding;

  await page.goto(issueUrl);
  await page.waitForTimeout(240);
  await page.evaluate(banner => document.body.innerHTML += banner, BANNER)

};

export const presentRandomFinding = async ({
  browserContext,
  db,
  watson,
}: {
  readonly browserContext: BrowserContext;
  readonly db: Lokijs;
  readonly watson: string;
}) => {

  const maybeRandomFinding = await getRandomFinding({db, watson});

  // We expect at least an initial random finding to begin with.
  if (!maybeRandomFinding)
    throw new Error(`Expected \`Finding\` finding, encountered ${
      typeof maybeRandomFinding
    }.`);

  const {issueUrl} = maybeRandomFinding;

  await new Promise(resolve => setTimeout(resolve, 1000));

  const page = await browserContext.newPage();

  await page.goto(issueUrl);

  await page.on('framenavigated', async (frame) => {
    if (frame.url() === NAVIGATE_RANDOMIZE)
      await navigateToRandomFinding({db, page, watson});
  });

  await navigateToRandomFinding({db, page, watson});

};

export const createViewer = async ({
  db,
  executablePath,
  port,
  watson,
}: {
  readonly db: Lokijs,
  readonly executablePath: string;
  readonly port: number;
  readonly watson: string;
}) => {
  const {browserContext} = await createStealthBrowserContext({
    executablePath,
    headless: false,
  });

  return presentRandomFinding({browserContext, db, watson});
};

