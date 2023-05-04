/*
search.ts
Search route builders
*/

import app from '../app';
import db from '../db';

/** The body of a search request. */
export type SearchBody = {
  query: string;
  filters: Record<string, boolean>;
};

/** The options for a search builder. */
export type SearchBuilderOptions = {
  /** The object to search. */
  object: string;
  /** Filters the search route supports. */
  filters: Record<
    string,
    {
      /** The SQL condition of this filter. */
      sql: string;
      /** Whether or not this filter can only be used by admins. */
      admin?: boolean;
    }
  >;
  /** The RETURNING part of the SQL statement. */
  returning?: string;
  /** The ORDER BY part of the SQL statement. */
  ordering?: string;
  /** The fields to search by. Defaults to ['name']. */
  searchBy?: string[];
};

/** Generate routes for an object search. */
function searchRoutes({
  object: obj,
  filters,
  returning,
  ordering,
  searchBy,
}: SearchBuilderOptions) {
  // god forgive me for what I have done
  app.put(`/api/${obj}s/search`, async (req, res) => {
    const conditions = Object.entries(req.body.filters ?? {})
      .filter(([_, v]) => v)
      .map(([k]) => filters[k]?.sql)
      .filter((s) => s);
    if (req.body.query && req.body.query !== '')
      conditions.push(
        '(' +
          (searchBy ?? ['name'])
            .map((col) => `"${obj}".${col} %> $1::text`)
            .join(' OR ') +
          ')'
      );

    const response = await db.query(
      `
      SELECT
        ${returning ?? '*'}
      FROM public.${obj} "${obj}"
      ${conditions.length > 0 ? 'WHERE' : ''}
        ${conditions.join(' AND ')}
      ${ordering ? `ORDER BY ${ordering}` : ''}
      `,
      req.body.query && req.body.query !== '' ? [req.body.query] : []
    );

    res.status(200);
    res.send(response.rows);
  });
}

// Generate search routes for events
searchRoutes({
  object: 'event',
  filters: {
    finished: {
      sql: 'event.end_time < CURRENT_TIMESTAMP',
    },
    inactive: {
      sql: 'event.active = FALSE',
      admin: true,
    },
    upcoming: {
      sql: 'event.end_time >= CURRENT_TIMESTAMP',
    },
  },
  ordering: 'event.start_time DESC',
});

// Generate search routes for users
searchRoutes({
  object: 'user',
  filters: {
    admin: { sql: '"user".admin = TRUE' },
    volunteer: { sql: '"user".volunteer = TRUE' },
    donator: { sql: '"user".donator = TRUE' },
    inactive: { sql: '"user".active = FALSE' },
  },
  searchBy: ['first_name', 'last_name'],
  ordering: `active DESC,
    admin DESC,
    last_name ASC,
    first_name ASC`,
});
