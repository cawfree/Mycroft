import {BrowserContext} from '../@types';

export const openPageAndWaitUntilLoaded = async ({
  browserContext,
  url,
}: {
  readonly browserContext: BrowserContext;
  readonly url: string;
}) => {

  const page = await browserContext.newPage();

  await page.goto(url);
  await page.waitForNavigation({waitUntil: 'networkidle2'});

  return page;

};

