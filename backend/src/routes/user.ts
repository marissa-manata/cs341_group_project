/*
user.ts
User lookup and modification routes.
*/

import bcrypt from 'bcrypt';
import {
  checkAuthorization,
  getAuthorizedUser,
  parseAuthorization,
} from '../api/auth';
import app from '../app';
import db from '../db';

/** A user registry in the database. */
type UserRegister = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

// GET /api/user
// Get the current user.
app.get('/api/user', async (req, res) => {
  try {
    const authorization = parseAuthorization(req, res);
    if (res.closed || !authorization) return;

    const user = await checkAuthorization(authorization);
    if (!user) throw 'invalid_credentials';
    res.send(user);
  } catch (error) {
    res.status(400);
    res.send({ error: 'invalid_credentials' });
  }
});

// GET /api/user/volunteer
// Get a user's volunteer registrations.
app.get('/api/user/volunteer', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;

  const id = user.admin && req.query.id ? req.query.id : user.id;

  const list = await db.query(
    `
    SELECT
      v.user, v.event, v.start_time, v.end_time,
      e.name event_name, e.description event_description,
      e.location event_location, e.start_time event_start_time,
      e.end_time event_end_time,
      e.volunteers_required event_volunteers_required
    FROM public.volunteer v
    LEFT JOIN public.event e
      ON v.event = e.id
    WHERE v.user = $1::uuid
    ORDER BY v.start_time ASC
    `,
    [id]
  );

  res.status(200);
  res.send(list.rows);
});

// POST /api/user
// Register an account.
app.post('/api/user', async (req, res) => {
  const user: UserRegister = req.body;

  const emailUser = await db.query(
    `SELECT email FROM public.user WHERE email = $1::text`,
    [user.email]
  );

  if (emailUser.rowCount !== 0) {
    res.status(400);
    res.send({ error: 'email_in_use' });
    return;
  }

  const passwordHash = await bcrypt.hash(user.password, 10);
  await db.query(
    `
    INSERT
      INTO public.user (email, password, first_name, last_name)
      VALUES ($1::text, $2::text, $3::text, $4::text)
    `,
    [user.email, passwordHash, user.first_name, user.last_name]
  );
  res.send({});
});

// PATCH /api/user/password
// Change the current user's password.
app.patch('/api/user/password', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;

  const { current, new: newPassword } = req.body;

  if (!(await bcrypt.compare(current, user.password))) {
    res.status(400);
    res.send({ error: 'invalid_password' });
    return;
  }

  try {
    await db.query(
      `UPDATE public.user SET password = $2::text WHERE id = $1::uuid`,
      [user.id, await bcrypt.hash(newPassword, 10)]
    );

    res.status(200);
    res.send({});
  } catch (e) {
    console.log('failed to change password', e);
    res.status(500);
    res.send({ error: e });
  }
});

// PATCH /api/user/enroll
// Enroll the current user for a certain flag.
app.patch('/api/user/enroll', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;

  const { type } = req.query;

  // yes, this is repetitive, but
  // SQL injection would be bad
  // so I just match against all possible `type`s
  if (type === 'volunteer') {
    await db.query(
      `
        UPDATE public.user SET volunteer = true WHERE id = $1::uuid
      `,
      [user.id]
    );

    res.status(200);
    res.send({});
  } else if (type === 'donator') {
    await db.query(
      `
        UPDATE public.user SET donator = true WHERE id = $1::uuid
      `,
      [user.id]
    );

    res.status(200);
    res.send({});
  } else {
    res.status(400);
    res.send({
      error: 'bad_enroll_type',
      message: 'expected "volunteer" or "donator" for type',
    });
  }
});

// PATCH /api/user/:id/flag
// Set a flag for a user.
//
// Body:
// {
//   key: 'admin' | 'volunteer' | 'donate';
//   value: boolean;
// }
app.patch('/api/user/:id/flag', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) {
    res.status(403);
    res.send({ error: 'not_admin' });
    return;
  }

  const { id } = req.params;
  const { key, value } = req.body;

  if (!['admin', 'volunteer', 'donator'].includes(key)) {
    res.status(400);
    res.send({ error: 'invalid_flag' });
    return;
  }

  if (key === 'admin' && user.id === id) {
    res.status(400);
    res.send({ error: 'reflexive_admin' });
    return;
  }

  await db.query(
    `
    UPDATE public.user
    SET ${key} = $2::boolean
    WHERE id = $1::uuid
    `,
    [id, value]
  );

  res.status(200);
  res.send({});
});

// POST /api/user/funds
// Add user funds to the current user.
//
// Query params:
// amount: number;
app.post('/api/user/funds', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.donator) {
    res.status(403);
    res.send({ error: 'not_donator' });
    return;
  }

  const { amount } = req.query;

  // Check that we can add without problems
  const add = Number(amount);
  if (user.balance + add >= 100000000) {
    res.status(400);
    res.send({ error: 'over_limit' });
    return;
  }

  const newUser = await db.query(
    `
    UPDATE public.user
    SET balance = balance + $2::integer
    WHERE id = $1::uuid
    RETURNING *
    `,
    [user.id, add]
  );

  if (newUser.rowCount === 0) {
    res.status(404);
    res.send({ error: 'no_user' });
    return;
  }

  res.status(200);
  res.send(newUser.rows[0]);
});

// GET /api/user/:id
// Get a user by their ID.
app.get('/api/user/:id', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;

  const { id } = req.params;
  const fetchedUser = await db.query(
    `
    SELECT
      active,
      id, first_name, last_name,
      admin, donator, volunteer
    FROM public.user
    WHERE id = $1::uuid
    `,
    [id]
  );
  if (fetchedUser.rowCount === 0) {
    res.status(404);
    res.send({ error: 'no_user' });
  } else {
    res.status(200);
    res.send(fetchedUser.rows[0]);
  }
});

// DELETE /api/user/:id
// Hard-delete a user.
app.delete('/api/user/:id', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) {
    res.status(403);
    res.send({ error: 'not_admin' });
    return;
  }
  if (req.params.id === user.id) {
    res.status(400);
    res.send({ error: 'reflexive_deletion' });
  }

  try {
    const response = await db.query(
      `
      DELETE FROM public.user u WHERE u.id = $1::uuid RETURNING *
      `,
      [req.params.id]
    );

    if (response.rowCount === 0) {
      res.status(404);
      res.send({ error: 'no_user' });
    } else {
      res.status(200);
      res.send(response.rows[0]);
    }
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send({ error: e });
  }
});

// PATCH /api/user/:id/active
// Activate or deactivate a user.
//
// Query params:
// value: boolean;
app.patch('/api/user/:id/active', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) {
    res.status(403);
    res.send({ error: 'not_admin' });
    return;
  }

  const { value } = req.query;
  if (req.params.id === user.id && value !== 'true') {
    res.status(400);
    res.send({ error: 'reflexive_deactivate' });
    return;
  }

  try {
    const response = await db.query(
      `
      UPDATE public.user SET active = $2::boolean WHERE id = $1::uuid RETURNING *
      `,
      [req.params.id, value === 'true']
    );

    if (response.rowCount === 0) {
      res.status(404);
      res.send({ error: 'no_user' });
    } else {
      res.status(200);
      res.send(response.rows[0]);
    }
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send({ error: e });
  }
});

// GET /api/users (deprecated)
// Get a list of all users. This endpoint is deprecated
// in favor of the search routes in search.ts.
app.get('/api/users', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) {
    res.status(403);
    res.send({ error: 'not_admin' });
    return;
  }

  const { offset, limit } = req.query;

  try {
    const response = await db.query(
      `
    SELECT
      id, email, first_name, last_name, balance,
      active, admin, donator, volunteer
    FROM public.user
    ORDER BY
      active DESC,
      admin DESC,
      last_name ASC,
      first_name ASC
    LIMIT $1::integer
    OFFSET $2::integer
    `,
      [limit ?? 20, offset ?? 0]
    );

    res.status(200);
    res.send(response.rows);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send({ error: e });
  }
});
