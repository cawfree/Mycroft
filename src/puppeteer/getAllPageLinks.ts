import {Page} from 'puppeteer-core';

export const getAllPageLinks = async (page: Page): Promise<readonly string[]> => 
  // @ts-expect-error missing_declaration
  page.$$eval('a', as => as.map(a => a.href));

