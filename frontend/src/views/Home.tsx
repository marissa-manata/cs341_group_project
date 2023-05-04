import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Link,
  SkeletonText,
  Stack,
  Text,
} from '@chakra-ui/react';
import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import { MdLocationPin } from 'react-icons/md';
import { WiTime3 } from 'react-icons/wi';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useFetchResource } from 'src/api/hooks';
import {
  selectUserIsAdmin,
  selectUserIsDonator,
  selectUserIsVolunteer,
} from 'src/api/user';
import Help from 'src/components/Help';
import RouterLink from 'src/components/RouterLink';
import { Event } from 'src/views/Events';

/** The thumb for events. Used in the event list. */
export const EventThumb: React.FC<Event> = (event) => {
  return (
    <Box borderRadius="md" borderWidth="1px" my={3} px={4} py={3}>
      <Stack spacing={2}>
        <Heading size="lg">
          <Link as={RouterLink} to={`/events/${event.id}`}>
            {event.name}{' '}
            {!event.active && (
              <>
                <Badge>Inactive</Badge>{' '}
              </>
            )}
            {Date.now() > Date.parse(event.end_time) && <Badge>Finished</Badge>}
          </Link>
        </Heading>
        <Text>{event.description}</Text>
        <Flex align="center" gap={6}>
          <Flex align="center" gap={1} color="whiteAlpha.600">
            <Icon as={MdLocationPin} />
            {event.location}
          </Flex>
          <Flex align="center" gap={1} color="whiteAlpha.600">
            <Icon as={WiTime3} />
            {moment(event.start_time).format('MMM Do YYYY, h:mm A')}
          </Flex>
        </Flex>
      </Stack>
    </Box>
  );
};

/** The home page. */
const Home = () => {
  const navigate = useNavigate();
  const events = useFetchResource<Array<Event>>(`/api/events`);
  const isAdmin = useSelector(selectUserIsAdmin);
  const isVolunteer = useSelector(selectUserIsVolunteer);
  const isDonor = useSelector(selectUserIsDonator);

  // memoized help text
  const helpText = useMemo(() => {
    let help = [
      'Here you can see all the events created by your organization',
      'Click on an event below for more information',
    ];
    if (isVolunteer) {
      help[help.length - 1] += ' and to volunteer';
      if (isDonor) {
        help[help.length - 1] += ' or donate';
      }
    } else if (isDonor) {
      help[help.length - 1] += ' and to donate';
    }
    if (!isVolunteer || !isDonor) {
      help = help.concat(['To enroll as a ']);
      if (!isVolunteer) help[help.length - 1] += 'volunteer';
      if (!isVolunteer && !isDonor) help[help.length - 1] += ' or ';
      if (!isDonor) help[help.length - 1] += 'donor';
      help[help.length - 1] += ', go to your profile in the upper-right cornor';
    }
    if (isAdmin)
      help = help.concat(['As an admin you can also create new events']);
    return help;
  }, [isVolunteer, isAdmin, isDonor]);

  // when the create event button is clicked
  const onCreateEvent = useCallback(
    () => navigate('/events/create'),
    [navigate]
  );

  // the events, mapped into `EventThumb`s
  const eventsList = useMemo(
    () => events.data?.map((event) => <EventThumb key={event.id} {...event} />),
    [events.data]
  );

  return (
    <Container my={5} maxW="container.md">
      <Stack spacing={3}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap="2">
            <Heading>Events</Heading>
            <Help header="Events" text={helpText}></Help>
          </Flex>
          <Flex gap={3}>
            <Button as={RouterLink} to="/events/search">
              Search
            </Button>
            {isAdmin && (
              <Button colorScheme="blue" onClick={onCreateEvent}>
                Create event
              </Button>
            )}
          </Flex>
        </Flex>
        <SkeletonText
          isLoaded={!events.loading}
          mt="4"
          noOfLines={6}
          spacing="4"
        >
          {eventsList}
        </SkeletonText>
      </Stack>
    </Container>
  );
};

export default Home;
