import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Skeleton,
  SkeletonText,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import moment from 'moment';
import React, { useMemo } from 'react';
import { MdHourglassBottom, MdLocationPin, MdPerson } from 'react-icons/md';
import { WiTime1, WiTime5 } from 'react-icons/wi';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  selectUserId,
  selectUserIsAdmin,
  selectUserIsDonator,
  selectUserIsVolunteer,
} from 'src/api/user';
import { AdminBadge, DonatorBadge, InactiveBadge } from 'src/components/Badges';
import Help from 'src/components/Help';
import RemoveButtons, {
  useActiveCallbackResource,
} from 'src/components/RemoveButtons';
import RouterLink from 'src/components/RouterLink';
import { HttpResource, useStatefulFetchResource } from '../../api/hooks';
import EventDonationTable, { Donation } from '../Donations/DonationTable';
import EventVolunteerTable from './components/EventVolunteerTable';

/** An instance of a volunteer from the database. */
export type Volunteer = {
  event: string;
  user: string;
  start_time: string;
  end_time: string;
  email: string;
  first_name: string;
  last_name: string;
};

/** An instance of an event from the database. */
export type Event = {
  active: boolean;
  id: string;
  name: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  volunteers_required: number;
  volunteers: Volunteer[];
  donations: Donation[];
};

/** A context of event data. Used by child components of this page. */
export const EventContext = React.createContext<HttpResource<Event>>({
  loading: true,
});

/** The event page. The id param dictates which event to render. */
const EventPage = () => {
  const { id } = useParams();

  // basic user info
  const userId = useSelector(selectUserId);
  const isAdmin = useSelector(selectUserIsAdmin);
  const isVolunteer = useSelector(selectUserIsVolunteer);
  const isDonator = useSelector(selectUserIsDonator);

  // grab the event
  const [event, setEvent] = useStatefulFetchResource<Event>(
    `/api/events/${id}`
  );
  const onActiveChange = useActiveCallbackResource(setEvent);

  // memoized data to prevent recomputation
  const volunteeringFor = useMemo(
    () => event.data?.volunteers.some((v) => v.user === userId),
    [userId, event.data?.volunteers]
  );

  const isFinished = useMemo(
    () => event.data && Date.now() > Date.parse(event.data.end_time),
    [event.data]
  );

  const startTime = useMemo(
    () => moment(event.data?.start_time).format('MMM Do YYYY, h:mm A'),
    [event.data?.start_time]
  );

  const endTime = useMemo(
    () => moment(event.data?.end_time).format('MMM Do YYYY, h:mm A'),
    [event.data?.end_time]
  );

  const duration = useMemo(
    () =>
      moment
        .duration(
          moment(event.data?.end_time).diff(moment(event.data?.start_time))
        )
        .humanize(),
    [event.data?.start_time, event.data?.end_time]
  );

  const volunteersRemaining = event.data
    ? event.data.volunteers_required - event.data.volunteers.length
    : 0;

  const volunteersFull = event.data
    ? event.data.volunteers_required !== 0 && volunteersRemaining === 0
    : false;

  const helpText = useMemo(() => {
    let help = [
      'Listed below is all the information for the event "' +
        event.data?.name +
        '"',
    ];
    if (isVolunteer || isDonator) {
      let line = '';
      if (isVolunteer) line += 'Volunteer';
      if (isVolunteer && isDonator) line += ' or ';
      if (isDonator) line += 'Donate';
      line += ' for this event to the right';
      help = help.concat(line);
    }
    return help;
  }, [event.data?.name, isVolunteer, isDonator]);

  const donateHelp = useMemo(() => {
    return [
      'Here is a list of the donations you have made to the event "' +
        event.data?.name +
        '"',
      'If you do not recognize any of these donations, plese contact an admin.',
    ];
  }, [event.data?.name]);

  return (
    <EventContext.Provider value={event}>
      <Container my={3} maxW="container.md">
        <Stack spacing={3}>
          <Skeleton isLoaded={!event.loading}>
            <Flex align="center" justify="space-between">
              <Flex align="center" gap="2">
                <Heading size="2xl">{event.data?.name}</Heading>
                <Help header="Event Information" text={helpText}></Help>
              </Flex>
              <Flex align="center" gap={3}>
                {isVolunteer && (
                  <Tooltip
                    isDisabled={!volunteeringFor}
                    label="To cancel volunteering, please contact an Admin."
                    hasArrow
                  >
                    <Button
                      colorScheme="red"
                      disabled={volunteeringFor || volunteersFull}
                      as={volunteeringFor ? undefined : RouterLink}
                      to={volunteeringFor || volunteersFull ? '#' : 'volunteer'}
                    >
                      {volunteeringFor
                        ? 'Volunteered'
                        : volunteersFull
                        ? 'No slots available'
                        : 'Volunteer'}
                    </Button>
                  </Tooltip>
                )}
                {isDonator && (
                  <Button colorScheme="green" as={RouterLink} to="donate">
                    Donate
                  </Button>
                )}
              </Flex>
            </Flex>
          </Skeleton>
          <Skeleton isLoaded={!event.loading} color="whiteAlpha.600">
            <HStack spacing={8}>
              <Flex direction="row" align="center" gap={1} fontSize="lg">
                <Icon as={MdLocationPin} /> {event.data?.location}
              </Flex>
              {event.data && event.data.volunteers_required > 0 && (
                <Flex direction="row" align="center" gap={1} fontSize="lg">
                  <Icon as={MdPerson} /> {event.data?.volunteers_required}{' '}
                  volunteer{event.data.volunteers_required > 1 ? 's' : ''}{' '}
                  required
                </Flex>
              )}
              {isFinished && <Badge>Finished</Badge>}
              {event.data && !event.data.active && <InactiveBadge />}
            </HStack>
          </Skeleton>
          {event.data &&
            event.data.volunteers.length < event.data.volunteers_required && (
              <Alert status="error" variant="left-accent">
                <AlertIcon />
                <AlertTitle>
                  This event does not have enough volunteers!
                </AlertTitle>
                <AlertDescription>
                  It needs {volunteersRemaining} more volunteer
                  {volunteersRemaining === 1 ? '' : 's'}.
                </AlertDescription>
              </Alert>
            )}
          <SkeletonText isLoaded={!event.loading} noOfLines={4}>
            {event.data?.description}
          </SkeletonText>
          <Skeleton isLoaded={!event.loading} color="whiteAlpha.700">
            <Flex align="center" gap={2}>
              <Icon as={MdHourglassBottom} />
              <Text>
                Last{isFinished ? 'ed' : 's'} <b>{duration}</b>
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Icon as={WiTime1} />
              <Text>
                Start{isFinished ? 'ed' : 's'} at <b>{startTime}</b>
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Icon as={WiTime5} />
              <Text>
                End{isFinished ? 'ed' : 's'} at <b>{endTime}</b>
              </Text>
            </Flex>
          </Skeleton>
          {isDonator && (
            <Skeleton isLoaded={!event.loading}>
              <Stack spacing={3}>
                <Flex align="center" gap="2">
                  <Heading size="md">
                    Your donations <DonatorBadge />
                  </Heading>
                  <Help header="Donation List" text={donateHelp} size="sm" />
                </Flex>
                <EventDonationTable event={id} user={userId} />
              </Stack>
            </Skeleton>
          )}
          {isAdmin && (
            <Skeleton isLoaded={!event.loading}>
              <Stack spacing={3}>
                <Heading size="md">
                  Donators <AdminBadge />
                </Heading>
                <EventDonationTable admin event={id} />
                <Heading size="md">
                  Volunteers <AdminBadge />
                </Heading>
                <EventVolunteerTable />
                <Heading size="md">
                  Actions <AdminBadge />
                </Heading>
                <RemoveButtons
                  endpoint={`/api/events/${event.data?.id}`}
                  active={event.data?.active ?? true}
                  onActiveChange={onActiveChange}
                />
              </Stack>
            </Skeleton>
          )}
        </Stack>
      </Container>
    </EventContext.Provider>
  );
};

export default EventPage;
