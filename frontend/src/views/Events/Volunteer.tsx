import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import moment from 'moment';
import { useCallback, useMemo, useState } from 'react';
import { WiTime1, WiTime5 } from 'react-icons/wi';
import { useNavigate, useParams } from 'react-router-dom';
import fetchClient from 'src/api/fetch';
import { useFetchResource } from 'src/api/hooks';
import Help from 'src/components/Help';
import { Event } from '.';
import EventTimeSelector from './components/EventTimeSelector';

const helpText = [
  'Enter the time range you would like to volunteer for, ' +
    'either by manually setting the start & end times or by using the range slider',
  'Leave settings as-is to voulunteer for the entire event',
  "You cannot volunteer if another event you're volunteered for overlaps",
];

/** Event volunteering page. */
const EventVolunteer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const event = useFetchResource<Event>(`/api/events/${id}`);
  const volunteerCount = useMemo(
    () => event.data?.volunteers.length,
    [event.data?.volunteers]
  );

  const startTime = useMemo(
    () => moment(event.data?.start_time).format('MMM Do YYYY, h:mm A'),
    [event.data?.start_time]
  );

  const endTime = useMemo(
    () => moment(event.data?.end_time).format('MMM Do YYYY, h:mm A'),
    [event.data?.end_time]
  );

  const [userStartTime, setUserStartTime] = useState<number>(0);
  const [userEndTime, setUserEndTime] = useState<number>(0);

  const onVolunteer = useCallback(() => {
    // make the request
    setLoading(true);
    fetchClient(`/api/events/${id}/volunteer`, {
      method: 'PATCH',
      body: JSON.stringify({
        start_time: new Date(userStartTime).toISOString(),
        end_time: new Date(userEndTime).toISOString(),
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (res.ok) {
          navigate(`/events/${id}`);
        } else {
          // handle errors
          setLoading(false);
          const body = await res.json();
          if (body?.error === 'already_volunteering') {
            setError('You are already volunteering for this event.');
          } else if (body?.error === 'overlapping_times') {
            setError(
              'Another event you are volunteered for overlaps with this event.'
            );
          } else if (body?.error === 'bad_range') {
            setError('Invalid range, please select times during the event.');
          } else if (body?.error === 'end_before_start') {
            setError('End time must come after start time.');
          } else {
            setError('An unknown error occurred while volunteering.');
            console.log('Generic volunteer error', body);
          }
        }
      })
      .catch((e) => {
        console.log('Error occurred while volunteering', e);
        setLoading(false);
        setError('Unknown error occurred while volunteering.');
      });
  }, [id, userStartTime, userEndTime, navigate]);

  return (
    <Container my={3}>
      <Stack spacing={3}>
        <Skeleton isLoaded={!event.loading}>
          <Stack spacing={3}>
            <Flex align="center" gap="2">
              <Heading size="md">Volunteer</Heading>
              <Help size="sm" header="Volunteer" text={helpText} />
            </Flex>
            <Heading>{event.data?.name}</Heading>
          </Stack>
        </Skeleton>
        {volunteerCount != null &&
          event.data?.volunteers_required != null &&
          event.data?.volunteers_required !== 0 &&
          volunteerCount < event.data?.volunteers_required && (
            <Alert variant="left-accent">
              <AlertIcon />
              <AlertDescription>
                This event needs more volunteers.
              </AlertDescription>
            </Alert>
          )}
        {error && (
          <Alert status="error" variant="left-accent">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {userStartTime === userEndTime && (
          <Alert status="error" variant="left-accent">
            <AlertIcon />
            <AlertDescription>
              You must select a valid range of time. Make sure that the start
              time and end time for your volunteering are not the same.
            </AlertDescription>
          </Alert>
        )}
        <Skeleton isLoaded={!event.loading} as={Stack} spacing={3}>
          {event.data && (
            <EventTimeSelector
              event={event.data}
              onChangeStart={setUserStartTime}
              onChangeEnd={setUserEndTime}
            />
          )}
        </Skeleton>
        <Skeleton isLoaded={!event.loading} as={Stack} spacing={3}>
          <Flex align="center" gap={2}>
            <Icon as={WiTime1} />
            <Text>
              Starts at <b>{startTime}</b>
            </Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Icon as={WiTime5} />
            <Text>
              Ends at <b>{endTime}</b>
            </Text>
          </Flex>
        </Skeleton>

        <Skeleton isLoaded={!event.loading}>
          <Button
            colorScheme="red"
            w="full"
            isDisabled={loading}
            isLoading={loading}
            onClick={loading ? undefined : onVolunteer}
          >
            Volunteer
          </Button>
        </Skeleton>
      </Stack>
    </Container>
  );
};

export default EventVolunteer;
