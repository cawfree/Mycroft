import {BrowserContext} from '../@types';

export const openPageAndWaitUntilLoaded = async ({
  browserContext,
  url,
  waitUntil = 'networkidle2',
}: {
  readonly browserContext: BrowserContext;
  readonly url: string;
  readonly waitUntil?: Required<Parameters<Awaited<ReturnType<BrowserContext['newPage']>>['waitForNavigation']>>[number]['waitUntil'] | number;
}) => {

  const page = await browserContext.newPage();

  await page.goto(url);

  if (typeof waitUntil === 'number') {
    await page.waitFor(waitUntil);
  } else {
    await page.waitForNavigation({waitUntil});
  }

  return page;

};

