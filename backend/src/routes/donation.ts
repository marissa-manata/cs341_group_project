/*
donation.ts
Donation routes and handling
*/

import { getAuthorizedUser } from '../api/auth';
import app from '../app';
import db from '../db';
import sendNotification from './notification';

type DonationRegister = {
  amount: number;
  note: string;
};

// GET /api/donations
// Fetch a list of all donations
app.get('/api/donations', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) return;

  const donations = await db.query(
    `
		SELECT
			d.*,
			row_to_json(u.*) as "userData",
			row_to_json(e.*) as "eventData",
			row_to_json(p.*) as "programData"
		FROM public.donation d
		INNER JOIN public.user u ON d."user" = u.id
		LEFT JOIN public.event e on d.event = e.id
		LEFT JOIN public.program p on d.program = p.id
		ORDER BY d.timestamp DESC
		`
  );

  res.status(200);
  res.send(donations.rows);
});

// GET /api/donations/summary
// Get a summary of all donators, optionally over a time
//
// Query params:
// from?: timestamp
// to?: timestamp
app.get('/api/donations/summary', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) return;

  const from = req.query.from;
  const to = req.query.to;

  try {
    const summary = await db.query(
      `
        WITH grouped AS (
          SELECT d.user, sum(d.amount)
          FROM public.donation d
          ${
            !from || !to
              ? ''
              : `
          WHERE
            d.timestamp >= $1::timestamptz AND
            d.timestamp <= $2::timestamptz
          `
          }
          GROUP BY d.user
        )
        SELECT
          COALESCE(d.sum, 0) AS total,
          u.id, u.first_name, u.last_name, u.admin
        FROM grouped d
        FULL JOIN public.user u
          ON d.user = u.id
        WHERE u.donator
        ORDER BY u.admin DESC
        `,
      !from || !to ? [] : [from, to]
    );

    res.status(200);
    res.send(summary.rows);
  } catch (err) {
    res.status(200);
    res.send([]);
  }
});

/** Get a user's donations. */
const getUserDonations = (id: string) =>
  db
    .query(
      `
			SELECT
				d.*,
				row_to_json(e.*) as "eventData",
				row_to_json(p.*) as "programData"
			FROM public.donation d
			LEFT JOIN public.event e on d.event = e.id
			LEFT JOIN public.program p on d.program = p.id
			WHERE d.user = $1::uuid
			ORDER BY d.timestamp DESC
			`,
      [id]
    )
    .then((r) => r.rows);

// GET /api/user/donations
// Get the current user's donations.
app.get('/api/user/donations', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.donator) return;

  try {
    const d = await getUserDonations(user.id);
    res.status(200).send(d);
  } catch (error) {
    console.log('failed to get user donations', error);
    res.status(500).send({ error });
  }
});

// GET /api/user/:id/donations
// Get a user's donations.
app.get('/api/user/:id/donations', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) return;

  try {
    const d = await getUserDonations(req.params.id);
    res.status(200).send(d);
  } catch (error) {
    console.log('failed to get user donations', error);
    res.status(500).send({ error });
  }
});

// POST /api/donate
// Donate to the AMAZe organization.
app.post('/api/donate', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.donator) return;

  const donation: DonationRegister = req.body;

  if (donation.amount == null) {
    res.status(401);
    res.send({ error: 'bad_amount' });
    return;
  }

  donation.amount = Math.round(donation.amount);

  if (user.balance < donation.amount) {
    res.status(401);
    res.send({ error: 'insufficent_funds' });
    return;
  }

  await db.query(
    `
		UPDATE public.user
		SET balance = balance - $2::integer
		WHERE id = $1::uuid
		`,
    [user.id, donation.amount]
  );

  await db.query(
    `
		INSERT INTO public.donation ("user", amount, note)
		VALUES ($1::uuid, $2::integer, $3::text)
		`,
    [user.id, donation.amount, donation.note]
  );

  res.status(200);
  res.send({});
});

// DELETE /api/donations/:id
// Refund a donation by its ID.
app.delete('/api/donations/:id', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) return;

  const { id } = req.params;

  try {
    const donation = await db.query(
      `
      WITH deletion AS (
        DELETE
          FROM public.donation d
        WHERE d.id = $1::uuid
        RETURNING
          d.*
      )
      SELECT
        deletion.*,
        row_to_json(e.*) as "eventData",
        row_to_json(p.*) as "programData"
      FROM deletion
      LEFT JOIN public.event e ON deletion.event = e.id
      LEFT JOIN public.program p on deletion.program = p.id
			`,
      [id]
    );

    if (donation.rowCount === 0) {
      res.status(404);
      res.send({ error: 'no_donation' });
      return;
    }

    //return amount to user balance
    await db.query(
      `
			UPDATE public.user
			SET balance = balance + $1::integer
			WHERE id = $2::uuid
			`,
      [donation.rows[0].amount, donation.rows[0].user]
    );

    const subject =
      donation.rows[0].eventData?.name ?? donation.rows[0].programData?.name;

    const amount = (donation.rows[0].amount / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
    });

    await sendNotification(
      donation.rows[0].user,
      subject
        ? `Donation of $${amount} to ${subject} has been refunded.`
        : `Unrestricted donation of $${amount} has been refunded.`,
      user.id
    );

    res.status(200);
    res.send(donation.rows[0]);
  } catch (error) {
    console.log('Failed refunding', error);
    res.status(500);
    res.send({ error });
  }
});

// GET /api/events/:id/donations
// Get donations for an event.
//
// Query params:
// only?: 'user' (only show donations by current user)
app.get('/api/events/:id/donations', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin && req.query.only !== 'user') return;

  try {
    const donations = await db.query(
      `
			SELECT
				d.*, row_to_json(u.*) as "userData"
			FROM public.donation d
			LEFT JOIN public.user u on d."user" = u.id
			WHERE d.event = $1::uuid
			ORDER BY d.timestamp DESC
			`,
      [req.params.id]
    );
    res
      .status(200)
      .send(
        user.admin && req.query.only !== 'user'
          ? donations.rows
          : donations.rows.filter((d) => d.user === user.id)
      );
  } catch (error) {
    console.log('failed to get user donations', error);
    res.status(500).send({ error });
  }
});

// GET /api/programs/:id/donations
// Get donations for a program.
//
// Query params:
// only?: 'user' (only show donations by current user)
app.get('/api/programs/:id/donations', async (req, res) => {
  const user = await getAuthorizedUser(req, res);
  if (!user) return;
  if (!user.admin) return;

  try {
    const donations = await db.query(
      `
			SELECT
				d.*, row_to_json(u.*) as "userData"
			FROM public.donation d
			LEFT JOIN public.user u on d."user" = u.id
			WHERE d.program = $1::uuid
			ORDER BY d.timestamp DESC
			`,
      [req.params.id]
    );

    res
      .status(200)
      .send(
        user.admin && req.query.only !== 'user'
          ? donations.rows
          : donations.rows.filter((d) => d.user === user.id)
      );
  } catch (error) {
    console.log('failed to get user donations', error);
    res.status(500).send({ error });
  }
});
