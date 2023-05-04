/*
notification.ts
Notification deployment, propagation, and storage
*/

import { checkAuthorization, parseAuthorization } from '../api/auth';
import { User } from '../api/models';
import app, { io } from '../app';
import db from '../db';

/** All active socket connections. */
const connections: Record<string, string[]> = {};

/** Send a notification to a user. */
async function sendNotification(
  userId: string,
  content: string,
  fromUserId?: string
) {
  const response = await db.query(
    `
    WITH insertion AS (
      INSERT
        INTO public.notification ("user", content, "from")
        VALUES ($1::uuid, $2::text, $3::uuid)
      RETURNING *
    )
    SELECT
      insertion.*,
      f.first_name AS "from_first_name",
      f.last_name AS "from_last_name"
    FROM insertion
    LEFT JOIN public.user f ON insertion.from = f.id
    `,
    [userId, content, fromUserId]
  );

  console.log('Attempting to send notification to', userId);
  if (connections[userId])
    for (const c of connections[userId])
      io.sockets.sockets.get(c)?.emit('notification', response.rows[0]);

  return response;
}

// Handle socket.io connections
io.on('connection', async (socket) => {
  let user: User;
  const deregSocket = () => {
    if (user?.id && connections[user.id]) {
      console.log('Socket deregistering', user?.first_name, user?.last_name);
      connections[user.id] = connections[user.id].filter(
        (id) => id !== socket.id
      );
      if (connections[user.id].length === 0) delete connections[user.id];
    }
  };

  socket.on('login', async (creds) => {
    // deregister if already registered
    deregSocket();

    // decode credentials
    const [email, ...passParts] = Buffer.from(creds, 'base64')
      .toString('ascii')
      .split(':');

    // build Auth object
    const auth = { email, password: passParts.join(':') };

    // try to login with Auth object
    try {
      user = await checkAuthorization(auth);
    } catch (e) {
      return;
    }

    if (!user) {
      return;
    }

    // register connection in array
    (connections[user.id] ??= []).push(socket.id);

    console.log('Socket logged in', user.first_name, user.last_name);
  });

  // deregister connection when user logs out thru site
  socket.on('logout', () => {
    deregSocket();
  });

  // deregister connection when websocket closes
  socket.on('close', () => {
    deregSocket();
  });
});

// GET /api/user/notifications
// Get the current user's notifications.
app.get('/api/user/notifications', async (req, res) => {
  try {
    const authorization = parseAuthorization(req, res);
    if (res.closed || !authorization) return;

    const user = await checkAuthorization(authorization);
    if (!user) throw 'invalid_credentials';

    const notifications = await db.query(
      `
      SELECT
        n.*,
        f.first_name as "from_first_name",
        f.last_name as "from_last_name"
      FROM public.notification n
      LEFT JOIN public.user f ON n.from = f.id
      WHERE n.user = $1::uuid
      ORDER BY timestamp DESC
      LIMIT 25
      `,
      [user.id]
    );

    res.send(notifications.rows);
  } catch (error) {
    console.log('/api/user/notifications', error);
    res.status(400);
    res.send({ error: 'invalid_credentials' });
  }
});

// PATCH /api/user/notifications/read
// Mark all unread notifications as read.
app.patch('/api/user/notifications/read', async (req, res) => {
  try {
    const authorization = parseAuthorization(req, res);
    if (res.closed || !authorization) return;

    const user = await checkAuthorization(authorization);
    if (!user) throw 'invalid_credentials';

    await db.query(
      `
      UPDATE public.notification
      SET unread = false
      WHERE "user" = $1::uuid
      `,
      [user.id]
    );

    res.status(200);
    res.send({});
  } catch (error) {
    console.log('/api/user/notifications/read', error);
    res.status(500);
    res.send({ error });
  }
});

export default sendNotification;
