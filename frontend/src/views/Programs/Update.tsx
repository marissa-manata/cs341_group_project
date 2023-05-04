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
} from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import fetchClient from 'src/api/fetch';
import { useInputState } from 'src/api/hooks';

/** The program update page. */
const ProgramUpdatePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const newName = useInputState('');
  const newDescrip = useInputState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onUpdate = useCallback(() => {
    setLoading(true);
    fetchClient(`/api/programs/${id}/update`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newN: newName.value,
        newD: newDescrip.value,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          //handle errors
          console.log('error updating program!');
          console.log(res);
        } else {
          //updated the program
          navigate(`/programs/${id}`);
        }
      })
      .catch((e) => {
        console.log('Error occured while updating', e);
        setLoading(false);
        setError('Unknown error occurred while updating.');
      });
  }, [id, newName.value, newDescrip.value, navigate]);

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
              <FormLabel>New Program Name</FormLabel>
              <Input type="text" {...newName.props} />
            </FormControl>
          </GridItem>
          <GridItem>
            <FormControl>
              <FormLabel>New Program Description</FormLabel>
              <Input type="textbox" {...newDescrip.props} />
            </FormControl>
          </GridItem>
          <GridItem>
            <Button
              w="full"
              colorScheme="blue"
              onClick={onUpdate}
              isLoading={loading}
              isDisabled={loading}
            >
              Update Program
            </Button>
          </GridItem>
        </SimpleGrid>
      </Stack>
    </Container>
  );
};

export default ProgramUpdatePage;
