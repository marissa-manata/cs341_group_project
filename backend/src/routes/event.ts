/*
event.ts
Routes related to event lookup/management
*/

import { getAuthorizedUser } from '../api/auth';
import app from '../app';
import db from '../db';
import sendNotification from './notification';

/** An event registration in the database. */
type EventRegister = {
  name: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  volunteers_required: string;
};

// GET /api/events
// Get all events in the system that are active.
app.get('/api/events', async (req, res) => {
  const fetchedEvents = await db.query(
    `SELECT * FROM public.event WHERE active = TRUE ORDER BY start_time DESC, name ASC`
  );
  res.send(fetchedEvents.rows);
});

// GET /api/events/:id
// Get an event by its ID.
app.get('/api/events/:id', async (req, res) => {
  const user = await getAuthorizedUser(req, res, true);

  const { id } = req.params;

  const fetchedEvent = await db.query(
    `
        SELECT * FROM public.event
        WHERE id = $1::uuid
        `,
    [id]
  );
  if (fetchedEvent.rowCount === 0) {
    res.status(404);
    res.send({ error: 'no_event' });
  } else {
    const volunteers = await db.query(
      `
      SELECT
        v.user, v.event, v.start_time, v.end_time,
        u.email, u.first_name, u.last_name, u.active
      FROM public.volunteer v
      LEFT JOIN public.user u
        ON v.user = u.id
      WHERE v.event = $1::uuid
    `,
      [id]
    );

    const data = {
      ...fetchedEvent.rows[0],
      volunteers: user?.admin
        ? volunteers.rows
        : volunteers.rows.map((v) => (v.user === user?.id ? v : {})),
    };

    res.status(200);
    res.send(data);
  }
});

// PATCH /api/events/:id/volunteer
// Volunteer for an event.
//
// Query string:
// start_time?: timestamp - The start time in the volunteer registration.
// end_time?: timestamp - The end time in the volunteer registration.
app.patch('/api/events/:id/volunteer', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.volunteer) return;

  const { id } = req.params;
  const start_time = new Date(req.body.start_time);
  const end_time = new Date(req.body.end_time);

  const fetchedEvent = await db.query(
    `
        SELECT * FROM public.event
        WHERE id = $1::uuid
        `,
    [id]
  );

  if (fetchedEvent.rowCount === 0) {
    res.status(404);
    res.send({ error: 'no_event' });
  } else {
    const ev = fetchedEvent.rows[0];

    // Check time slot
    if (end_time < start_time) {
      res.status(400);
      res.send({ error: 'end_before_start' });
      return;
    }
    if (start_time < ev.start_time || end_time > ev.end_time) {
      res.status(400);
      res.send({ error: 'bad_range' });
      return;
    }

    // Check if already voluteering for event or if times overlap
    const fetchedVolunteer = await db.query(
      `
      SELECT * FROM public.volunteer v
      WHERE v.user = $1::uuid
      `,
      [user.id]
    );
    for (var i = 0; i < fetchedVolunteer.rowCount; i++) {
      const cev = fetchedVolunteer.rows[i];
      if (ev.id == cev.id) {
        res.status(400);
        res.send({ error: 'already_volunteering' });
        return;
      }
      if (start_time < cev.end_time && cev.start_time < end_time) {
        res.status(400);
        res.send({ error: 'overlapping_times' });
        return;
      }
    }

    await db.query(
      `
      INSERT INTO public.volunteer (event, "user", start_time, end_time)
      VALUES ($1::uuid, $2::uuid, $3::timestamptz, $4::timestamptz)
      `,
      [ev.id, user.id, start_time, end_time]
    );

    res.status(200);
    res.send({});
  }
});

// POST /api/events/:id/donate
// Donate to an event.
//
// Body:
// {
//   amount: number; - The amount to donate.
//   note: string; - The note.
// }
app.post('/api/events/:id/donate', async (req, res) => {
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

  const fetchedEvent = await db.query(
    `
        SELECT * FROM public.event
        WHERE id = $1::uuid
        `,
    [id]
  );

  if (fetchedEvent.rowCount === 0) {
    res.status(404);
    res.send({ error: 'no_event' });
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
      INSERT INTO public.donation (event, "user", note, amount)
      VALUES ($1::uuid, $2::uuid, $3::text, $4::integer)
      `,
      [fetchedEvent.rows[0].id, user.id, note, amount]
    );

    res.status(200);
    res.send({});
  }
});

// POST /api/events
// Create a new event.
//
// Body:
// EventRegister - the event to create in the database
app.post('/api/events', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) {
    res.status(403);
    res.send({ error: 'not_admin' });
    return;
  }

  const event: EventRegister = req.body;

  try {
    const response = await db.query(
      `
      INSERT 
        INTO public.event (name, description, location, start_time, end_time, volunteers_required)
        VALUES ($1::text, $2::text, $3::text, $4::timestamptz, $5::timestamptz, $6::integer)
        RETURNING *
      `,
      [
        event.name,
        event.description,
        event.location,
        event.start_time,
        event.end_time,
        event.volunteers_required,
      ]
    );

    res.status(200);
    res.send(response.rows[0]);
  } catch (e) {
    res.status(400);
    res.send({ error: e });
  }
});

// PATCH /api/events/:id/active
// Make an event active or inactive.
//
// Query params:
// value: boolean
app.patch('/api/events/:id/active', async (req, res) => {
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
      UPDATE public.event SET active = $2::boolean WHERE id = $1::uuid RETURNING *
      `,
      [req.params.id, value === 'true']
    );

    if (response.rowCount === 0) {
      res.status(404);
      res.send({ error: 'no_program' });
    } else {
      // send a notification to volunteers if we are deactivating
      if (value === 'false') {
        const volunteers = (
          await db.query(
            'SELECT v.user FROM public.volunteer v WHERE v.event = $1::uuid',
            [req.params.id]
          )
        ).rows.map((v) => v.user);

        for (const v of volunteers)
          await sendNotification(
            v,
            `${response.rows[0].name} has been cancelled by an admin.`,
            user.id
          );
      }

      res.status(200);
      res.send(response.rows[0]);
    }
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send({ error: e });
  }
});

// DELETE /api/events/:id
// Hard-delete an event by its ID.
app.delete('/api/events/:id', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) {
    res.status(403);
    res.send({ error: 'not_admin' });
    return;
  }

  try {
    const volunteers = (
      await db.query(
        `
      SELECT
        v.user
      FROM public.volunteer v
      WHERE v.event = $1::uuid
      `,
        [req.params.id]
      )
    ).rows.map((r) => r.user as string);

    const response = await db.query(
      `
      DELETE FROM public.event e WHERE e.id = $1::uuid RETURNING *
      `,
      [req.params.id]
    );

    if (response.rowCount === 0) {
      res.status(404);
      res.send({ error: 'no_event' });
    } else {
      for (const v of volunteers)
        sendNotification(
          v,
          `${response.rows[0].name} has been permanently cancelled by an admin.`,
          user.id
        );

      res.status(200);
      res.send(response.rows[0]);
    }
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send({ error: e });
  }
});

// DELETE /api/events/:id/volunteers/:user_id
// Cancel a user (user_id) from volunteering for an event (id).
app.delete('/api/events/:id/volunteers/:user_id', async (req, res) => {
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
      WITH deletion AS (
        DELETE
          FROM public.volunteer v
          WHERE v.event = $1::uuid AND v.user = $2::uuid
          RETURNING *
      )
      SELECT d.*, row_to_json(e.*) AS "eventData"
      FROM deletion d
      LEFT JOIN public.event e ON d.event = e.id
      `,
      [req.params.id, req.params.user_id]
    );

    if (response.rowCount === 0) {
      res.status(404);
      res.send({ error: 'no_volunteer' });
    } else {
      await sendNotification(
        response.rows[0].user,
        `Volunteering for ${response.rows[0].eventData.name} has been cancelled by an admin.`,
        user.id
      );

      res.status(200);
      res.send(response.rows[0]);
    }
  } catch (e) {
    console.log('Cancelling volunteer', e);
    res.status(400);
    res.send({ error: e });
  }
});
