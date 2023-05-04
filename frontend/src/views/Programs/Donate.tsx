import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import fetchClient from 'src/api/fetch';
import { useFetchResource, useInputState } from 'src/api/hooks';
import { selectUserBalance, setUserBalance } from 'src/api/user';
import Help from 'src/components/Help';

import { Program } from './Profile';

/** Program donation page. */
const ProgramDonate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const program = useFetchResource<Program>(`/api/programs/${id}`);
  const balance = useSelector(selectUserBalance);

  const note = useInputState('');
  const [amount, setAmount] = useState(1);
  const onAmountChange = useCallback(
    (_: string, n: number) => setAmount(n),
    []
  );

  const onDonate = useCallback(() => {
    if (!balance) return;

    setLoading(true);
    fetchClient(`/api/programs/${id}/donate`, {
      method: 'POST',
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        note: note.value.trim() === '' ? null : note.value,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (res.ok) {
          navigate(`/programs/${id}`);
          dispatch(setUserBalance(balance - amount * 100));
        } else {
          setLoading(false);
          const body = await res.json();
          setError('An unknown error occurred while donating.');
          console.log('Generic donation error', body);
        }
      })
      .catch((e) => {
        console.log('Error occurred while donating', e);
        setLoading(false);
        setError('Unknown error occurred while donating.');
      });
  }, [id, navigate, note.value, amount, balance, dispatch]);

  const helpText = [
    'Make a donation to this program',
    'To add funds to your account, go to your account page in the top right',
    'Notes you add to your donation will only be visible to you and the admins',
  ];

  return (
    <Container my={3}>
      <Stack spacing={3}>
        <Skeleton isLoaded={!program.loading}>
          <Stack spacing={3}>
            <Flex align="center" gap="2">
              <Heading size="md">Donate</Heading>
              <Help header="Donate" text={helpText} size="sm"></Help>
            </Flex>
            <Heading>{program.data?.name}</Heading>
          </Stack>
        </Skeleton>
        {error && (
          <Alert status="error" variant="left-accent">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Skeleton isLoaded={!program.loading} as={Stack} spacing={3}>
          <Text>Please input the amount you would like to donate.</Text>
          {balance != null && (
            <>
              <FormControl isRequired isInvalid={balance === 0}>
                <FormLabel>Amount to donate</FormLabel>
                <NumberInput
                  defaultValue={1}
                  onChange={onAmountChange}
                  min={0.01}
                  max={balance / 100}
                  precision={2}
                  flexGrow={1}
                  isDisabled={balance === 0}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                {balance === 0 && (
                  <FormErrorMessage>
                    Your account balance is empty.
                  </FormErrorMessage>
                )}
              </FormControl>
              <FormControl>
                <FormLabel>Note</FormLabel>
                <Input
                  type="text"
                  placeholder="An optional note for your donation..."
                  {...note.props}
                />
              </FormControl>
              <Button
                w="full"
                colorScheme="green"
                isDisabled={loading}
                isLoading={loading}
                onClick={loading ? undefined : onDonate}
              >
                Donate
              </Button>
            </>
          )}
        </Skeleton>
      </Stack>
    </Container>
  );
};

export default ProgramDonate;
