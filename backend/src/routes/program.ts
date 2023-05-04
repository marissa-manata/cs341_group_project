/*
program.ts
Program lookup and management routes
*/

import { getAuthorizedUser } from '../api/auth';
import app from '../app';
import db from '../db';

type ProgramRegister = {
  name: string;
  description: string;
};

// GET /api/programs
// Get all programs in the system.
app.get('/api/programs', async (req, res) => {
  const fetchedEvents = await db.query(
    `SELECT * FROM public.program WHERE active = TRUE`
  );
  res.send(fetchedEvents.rows);
});

// GET /api/programs/:id
// Get a certain program by its ID.
app.get('/api/programs/:id', async (req, res) => {
  const { id } = req.params;
  const user = await getAuthorizedUser(req, res, true);

  const fetchedProgram = await db.query(
    `
      SELECT * FROM public.program
      WHERE id = $1::uuid
    `,
    [id]
  );

  if (fetchedProgram.rowCount === 0) {
    res.status(404);
    res.send({ error: 'no_program' });
  } else {
    const donations = await db.query(
      `
      SELECT 
        d.id, d.user, d.program, d.note, d.amount, d.timestamp, u.first_name, u.last_name, u.active
      FROM public.donation d
      LEFT JOIN public.user u ON d.user = u.id
      WHERE d.program = $1::uuid
      ORDER BY d.timestamp ASC
      `,
      [id]
    );

    const data = {
      ...fetchedProgram.rows[0],
      donations: user?.admin
        ? donations.rows
        : user?.donator
        ? donations.rows.filter((d) => d.user === user.id)
        : undefined,
    };

    res.status(200);
    res.send(data);
  }
});

// POST /api/programs
// Create a new program with the given data.
//
// Body:
// ProgramRegister - the program to add
app.post('/api/programs', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) {
    res.status(403);
    res.send({ error: 'not_admin' });
    return;
  }

  const event: ProgramRegister = req.body;

  try {
    const response = await db.query(
      `
            INSERT 
             INTO public.program (name, description)
             VALUES ($1::text, $2::text)
             RETURNING *
             `,
      [event.name, event.description]
    );

    res.status(200);
    res.send(response.rows[0]);
  } catch (e) {
    res.status(400);
    res.send({ error: e });
  }
});

// DELETE /api/programs/:id
// Hard-delete a program by its ID.
app.delete('/api/programs/:id', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) {
    res.status(403);
    res.send({ error: 'not_admin' });
    return;
  }

  try {
    const response = await db.query(
      `
      DELETE FROM public.program p WHERE p.id = $1::uuid RETURNING *
      `,
      [req.params.id]
    );

    if (response.rowCount === 0) {
      res.status(404);
      res.send({ error: 'no_program' });
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

// PATCH /api/programs/:id/active
// Activate or deactivate a program.
//
// Query params:
// value: boolean;
app.patch('/api/programs/:id/active', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) {
    res.status(403);
    res.send({ error: 'not_admin' });
    return;
  }

  const { value } = req.query;

  try {
    const response = await db.query(
      `
      UPDATE public.program SET active = $2::boolean WHERE id = $1::uuid RETURNING *
      `,
      [req.params.id, value === 'true']
    );

    if (response.rowCount === 0) {
      res.status(404);
      res.send({ error: 'no_program' });
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

// POST /api/programs/:id/donate
// Donate to a certain program by its ID.
//
// Body:
// amount: number; - The amount to donate.
// note?: string; - The note with the donation.
app.post('/api/programs/:id/donate', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.donator) return;

  const { id } = req.params;
  let { amount, note } = req.body;

  if (amount == null) {
    res.status(401);
    res.send({ error: 'bad_amount' });
    return;
  }

  amount = Math.round(amount);

  if (user.balance < amount) {
    res.status(401);
    res.send({ error: 'insufficient_funds' });
    return;
  }

  const fetchedProgram = await db.query(
    `
      SELECT * FROM public.program
      WHERE id = $1::uuid
    `,
    [id]
  );

  if (fetchedProgram.rowCount === 0) {
    res.status(404);
    res.send({ error: 'no_program' });
  } else {
    // remove the amount from the user's balance
    await db.query(
      `
      UPDATE public.user
      SET balance = balance - $2::integer
      WHERE id = $1::uuid
      `,
      [user.id, amount]
    );

    // insert the donation
    await db.query(
      `
      INSERT INTO public.donation (program, "user", note, amount)
      VALUES ($1::uuid, $2::uuid, $3::text, $4::integer)
      `,
      [fetchedProgram.rows[0].id, user.id, note, amount]
    );

    res.status(200);
    res.send({});
  }
});

// DELETE /api/programs/:id/donate/:donation_id
// Refund a donation (donation_id) to a program (id).
app.delete('/api/programs/:id/donate/:donation_id', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) {
    res.status(403);
    res.send({ error: 'not_admin' });
    return;
  }

  const { donation_id } = req.params;

  const fetchedDonation = await db.query(
    `
    SELECT * FROM public.donation
    WHERE id = $1::uuid
    `,
    [donation_id]
  );

  if (fetchedDonation.rowCount === 0) {
    res.status(404);
    res.send({ error: 'no_donation ' });
  } else {
    //return the amount to the users balance
    await db.query(
      `
      UPDATE public.user
      SET balance = balance + $1::integer
      WHERE id = $2::uuid
      `,
      [fetchedDonation.rows[0].amount, fetchedDonation.rows[0].user]
    );

    try {
      const response = await db.query(
        `
        DELETE FROM public.donation 
        WHERE id = $1::uuid
        RETURNING *
        `,
        [donation_id]
      );
      if (response.rowCount === 0) {
        res.status(404);
        res.send({ error: 'no_donation pt2' });
      } else {
        res.status(200);
        res.send(response.rows[0]);
      }
    } catch (e) {
      res.status(400);
      res.send({ error: e });
    }
  }
});

// update a program
app.patch('/api/programs/:id/update', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) {
    res.status(403);
    res.send({ error: 'not_admin' });
    return;
  }

  const { newN: newName, newD: newDescription } = req.body;

  try {
    await db.query(
      `UPDATE public.program SET name = $2::text, description = $3::text WHERE id = $1::uuid`,
      [req.params.id, newName, newDescription]
    );

    res.status(200);
    res.send({});
  } catch (e) {
    console.log('failed to change program', e);
    res.status(500);
    res.send({ error: e });
  }
});
