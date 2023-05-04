import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  GridItem,
  Heading,
  Input,
  SimpleGrid,
  Skeleton,
  Stack,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import fetchClient from 'src/api/fetch';
import { selectUserIsAdmin } from 'src/api/user';
import { AdminBadge } from './Badges';
import Help from './Help';

/** A list of filters that can be set for a search page. */
type Filters = {
  field: string;
  label: string;
  admin?: boolean;
}[];

/** A list of filters to be used for the events search page. */
export const EVENT_FILTERS: Filters = [
  {
    field: 'finished',
    label: 'Finished events only',
  },

  {
    field: 'upcoming',
    label: 'Upcoming events only',
  },

  {
    field: 'inactive',
    label: 'Inactive events only',
    admin: true,
  },
];

/** A list of filters to be used for the users search page. */
export const USER_FILTERS: Filters = [
  {
    field: 'inactive',
    label: 'Inactive users only',
    admin: true,
  },
  {
    field: 'admin',
    label: 'Admins only',
    admin: true,
  },
  {
    field: 'volunteer',
    label: 'Volunteers only',
    admin: true,
  },
  {
    field: 'donator',
    label: 'Donators only',
    admin: true,
  },
];

/**
 * A generic search page.
 * Props can be used to make it search for any specific object (events, programs, users).
 */
const SearchPage = <R extends { id: string }>({
  component: Component,
  title,
  endpoint,
  filters,
  spacing,
  admin,
}: {
  component: React.ComponentType<R>;
  title: string;
  endpoint: string;
  filters?: {
    field: string;
    label: string;
    admin?: boolean;
  }[];
  spacing?: number;
  admin?: boolean;
}) => {
  const navigate = useNavigate();
  const isAdmin = useSelector(selectUserIsAdmin);

  // navigate home if the user is not an admin
  useEffect(() => {
    if (admin && isAdmin === false) navigate('/');
  }, [admin, isAdmin, navigate]);

  // internal state
  const [items, setItems] = useState<R[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchable, setSearchable] = useState(false);
  const [text, setText] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // the filter object that will be sent on search
  const [filterObj, setFilterObj] = useState(() =>
    Object.fromEntries(filters?.map((f) => [f.field, false]) ?? [])
  );

  // a wrapper over the input component that controls `text`.
  // also sets `searchable` to update the search button when the input changes
  const onTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    setSearchable(true);
  }, []);

  // toggle filters on and off
  const toggleFilters = useCallback(() => setShowFilters((s) => !s), []);

  // memoized list of checkboxes for each filter
  const filterChoices = useMemo(
    () =>
      filters
        ?.filter((f) => (f.admin ? isAdmin : true)) // filtering filters! who'd've thought
        .map((f) => (
          <GridItem key={f.field}>
            <Checkbox
              checked={filterObj[f.field]}
              onChange={(e) => {
                setFilterObj((o) => ({ ...o, [f.field]: e.target.checked }));
                setSearchable(true);
              }}
            >
              {f.label} {f.admin && <AdminBadge />}
            </Checkbox>
          </GridItem>
        )),
    [filters, filterObj, isAdmin]
  );

  // search and submit filter data
  const onSearch = useCallback(() => {
    if (loading) return;
    setLoading(true);

    // fetch the endpoint with the given data
    fetchClient(endpoint, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: text,
        filters: filterObj,
      }),
    })
      .then(async (res) => {
        setLoading(false);
        if (res.ok) {
          setSearchable(false);
          setItems(await res.json()); // assuming response body is R[]
        } else {
          console.log('Error searching', res);
        }
      })
      .catch((err) => {
        setLoading(false);
        console.log('Error searching', err);
      });
  }, [endpoint, filterObj, loading, text]);

  // run onSearch once on render
  useEffect(() => {
    onSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const help_text = useMemo(() => {
    return [
      'Enter the name of the ' +
        title.slice(0, title.length - 1).toLowerCase() +
        " you're looking for below and press Search",
      'Apply filters to limit the results of the search to only certain kinds of ' +
        title.toLowerCase(),
    ];
  }, [title]);

  return (
    <Container maxW="container.md" my={3}>
      <Stack spacing={3}>
        <Flex align="center" gap="2">
          <Heading>
            Search {title} {admin && <AdminBadge />}
          </Heading>
          <Help header={'Search for ' + title} text={help_text}></Help>
        </Flex>
        <Flex gap={3}>
          <Input
            type="text"
            placeholder="Enter a search term..."
            value={text}
            onChange={onTextChange}
          />
          {filters && (
            <Button onClick={toggleFilters}>
              Filters {showFilters ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </Button>
          )}
          <Button
            colorScheme="blue"
            onClick={loading || !searchable ? undefined : onSearch}
            isLoading={loading}
            isDisabled={loading || !searchable}
          >
            Search
          </Button>
        </Flex>
        {showFilters && (
          <Box borderRadius="md" borderWidth="1px" my={3} px={4} py={3}>
            <Stack spacing={3}>
              <Heading size="md">Filters</Heading>
              <SimpleGrid columns={2}>{filterChoices}</SimpleGrid>
            </Stack>
          </Box>
        )}
        <Skeleton isLoaded={!loading}>
          <Heading size="md">
            {items.length === 0 ? 'No results' : 'Results'}
          </Heading>
          <Stack spacing={spacing} my={spacing}>
            {items.map((r) => (
              <Component key={r.id} {...r} />
            ))}
          </Stack>
        </Skeleton>
      </Stack>
    </Container>
  );
};

export default SearchPage;
