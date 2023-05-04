import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Container,
  FormControl,
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

/** Program creation page. */
const ProgramCreatePage = () => {
  const navigate = useNavigate();
  const name = useInputState('');
  const description = useInputState<string, HTMLTextAreaElement>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const onCreate = useCallback(() => {
    if (loading) return;

    // field validation
    if (name.value.trim() == '')
      return setError('Program name must not be blank.');
    if (description.value.trim() == '')
      return setError('Description must not be empty.');

    // make the payload
    const data = {
      name: name.value,
      description: description.value,
    };

    // make the request
    setLoading(true);
    fetchClient('/api/programs', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          //handle errors
          console.log('error creating program!');
          console.log(res);
        } else {
          //created the program
          const program = await res.json();
          navigate(`/programs/${program.id}`);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [name, description, navigate, loading]);

  return (
    <Container my={3}>
      <Stack spacing={3}>
        <Heading>Create New Program</Heading>
        {error && (
          <Alert status="error" variant="left-accent">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <SimpleGrid columns={1} rowGap={3}>
          <GridItem>
            <FormControl>
              <FormLabel>Program name</FormLabel>
              <Input type="text" {...name.props} />
            </FormControl>
          </GridItem>
          <GridItem>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea {...description.props} />
            </FormControl>
          </GridItem>
          <GridItem>
            <Button
              w="full"
              colorScheme="blue"
              onClick={onCreate}
              isLoading={loading}
              isDisabled={loading}
            >
              Create Program
            </Button>
          </GridItem>
        </SimpleGrid>
      </Stack>
    </Container>
  );
};

export default ProgramCreatePage;
