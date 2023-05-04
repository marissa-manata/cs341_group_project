import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Container,
  FormControl,
  FormHelperText,
  FormLabel,
  GridItem,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Textarea,
} from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fetchClient from 'src/api/fetch';
import { useInputState } from 'src/api/hooks';

/** Event creation page. */
const EventCreatePage = () => {
  const navigate = useNavigate();
  const name = useInputState('');
  const description = useInputState<string, HTMLTextAreaElement>('');
  const location = useInputState('');
  const startTime = useInputState('');
  const endTime = useInputState('');
  const volunteers = useInputState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const onCreate = useCallback(() => {
    if (loading) return;

    // field error handling
    if (name.value.trim() === '')
      return setError('Event name must not be blank.');
    if (description.value.trim() === '')
      return setError('Description must not be empty.');
    if (location.value.trim() === '')
      return setError('Location must not be blank.');
    if (isNaN(Date.parse(startTime.value)))
      return setError('Event start time must be set.');
    if (isNaN(Date.parse(endTime.value)))
      return setError('Event end time must be set.');
    if (volunteers.value < 0)
      return setError('Volunteers required must be at least 0.');
    if (Date.parse(startTime.value) > Date.parse(endTime.value))
      return setError('Event start time must come before end time.');
    if (Date.parse(startTime.value) < Date.now())
      return setError(
        'Event start time must be set in advance. Choose a time that is later from now.'
      );

    // build the payload
    const data = {
      name: name.value,
      description: description.value,
      location: location.value,
      start_time: new Date(startTime.value).toISOString(),
      end_time: new Date(endTime.value).toISOString(),
      volunteers_required: volunteers.value,
    };

    // make the request
    setError(undefined);
    setLoading(true);
    fetchClient('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          // handle errors
          console.log('error creating event!');
          console.log(res);
        } else {
          // created the event
          const event = await res.json();
          navigate(`/events/${event.id}`);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    name.value,
    description,
    location.value,
    startTime.value,
    endTime.value,
    volunteers.value,
    navigate,
    loading,
  ]);

  return (
    <Container my={3}>
      <Stack spacing={3}>
        <Heading>Create new event</Heading>
        {error && (
          <Alert status="error" variant="left-accent">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <SimpleGrid columns={2} columnGap={3} rowGap={3}>
          <GridItem>
            <FormControl>
              <FormLabel>Event name</FormLabel>
              <Input type="text" {...name.props} />
            </FormControl>
          </GridItem>
          <GridItem>
            <FormControl>
              <FormLabel>Location</FormLabel>
              <Input type="text" {...location.props} />
            </FormControl>
          </GridItem>
          <GridItem colSpan={2}>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea {...description.props} />
            </FormControl>
          </GridItem>
          <GridItem>
            <FormControl>
              <FormLabel>Start time</FormLabel>
              <Input type="datetime-local" {...startTime.props} />
            </FormControl>
          </GridItem>
          <GridItem>
            <FormControl>
              <FormLabel>End time</FormLabel>
              <Input type="datetime-local" {...endTime.props} />
            </FormControl>
          </GridItem>
          <GridItem colSpan={2}>
            <FormControl>
              <FormLabel>Volunteers required</FormLabel>
              <Input type="number" {...volunteers.props} />
              <FormHelperText>
                Set to zero to indicate no volunteers are required.
              </FormHelperText>
            </FormControl>
          </GridItem>
          <GridItem colSpan={2}>
            <Button
              w="full"
              colorScheme="blue"
              onClick={onCreate}
              isLoading={loading}
              isDisabled={loading}
            >
              Create event
            </Button>
          </GridItem>
        </SimpleGrid>
      </Stack>
    </Container>
  );
};

export default EventCreatePage;
