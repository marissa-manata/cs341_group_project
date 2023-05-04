/*
auth.ts
Authentication handling services
*/

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../db';
import { User } from './models';

/** An authentication payload. */
type Auth = {
  email: string;
  password: string;
};

/** Parse authentication from an express request. */
export const parseAuthorization = (
  req: Request,
  res: Response,
  optional = false
) => {
  // fall back if no authorization headers are passed
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Basic ')
  ) {
    if (optional) return;

    res.status(401);
    res.send({ error: 'unauthorized' });
    res.end();
    return;
  }

  // decode credentials
  const credentials = Buffer.from(
    req.headers.authorization.substring(6),
    'base64'
  ).toString('ascii');

  // dissect credential string
  const colon = credentials.indexOf(':');
  const email = credentials.substring(0, colon);
  const password = credentials.substring(colon + 1);

  return { email, password } as Auth;
};

/** Check that an authorization payload matches a legitimate user. */
export const checkAuthorization = async (auth: Auth) => {
  const user = await db.query(
    `SELECT * FROM public.user WHERE email = $1::text AND active = true`,
    [auth.email]
  );
  if (user.rowCount === 0) return null;

  // compare password
  if (await bcrypt.compare(auth.password, user.rows[0].password))
    return user.rows[0];
  else throw 'incorrect_credentials';
};

/** Get an authorized user from an express request. */
export const getAuthorizedUser = async (
  req: Request,
  res: Response,
  optional = false
): Promise<User | undefined> => {
  // first parse authorization
  const authorization = parseAuthorization(req, res, optional);
  if (res.closed || !authorization) return;

  try {
    // then check and return a user if valid
    const user = await checkAuthorization(authorization);
    return user;
  } catch (error) {
    if (optional) return;

    res.status(403);
    res.send({ error });
    res.end();
    return;
  }
};
