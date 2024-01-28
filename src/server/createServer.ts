import express from 'express';
import Lokijs from 'lokijs';

import {getRandomFinding} from '../database';

export const createServer = async ({
  db,
  port,
  watson,
}: {
  readonly db: Lokijs;
  readonly port: number;
  readonly watson: string;
}) => new Promise<void>(
  resolve => express()
    .get('/', (req, res) => res.status(200).send('hello'))
    .get(
      '/random',
      async (_, res, next) => {

        const finding = await getRandomFinding({db, watson});

        if (!finding)
          return next(new Error('Failed to fetch a random finding.'));

        return res.status(200).json(finding);
      },
    )
    .listen(port, resolve)
);

