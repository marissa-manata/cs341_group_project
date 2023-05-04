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
import { useNavigate } from 'react-router-dom';
import fetchClient from 'src/api/fetch';
import { useInputState } from 'src/api/hooks';
import { selectUserBalance, setUserBalance } from 'src/api/user';
import Help from 'src/components/Help';

const Donate = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const balance = useSelector(selectUserBalance);

  const help_text = [
    'Make an unrestricted donation to the organization',
    'To add funds to your account, go to your account page in the top right',
    'Notes you add to your donation will only be visible to you and the admins',
  ];

  const note = useInputState('');
  const [amount, setAmount] = useState(1);
  const onAmountChange = useCallback(
    (_: string, n: number) => setAmount(n),
    []
  );

  const onDonate = useCallback(() => {
    if (!balance) return;
    setLoading(true);
    fetchClient(`/api/donate`, {
      method: 'POST',
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        note: note.value.trim() === '' ? null : note,
      }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (res.ok) {
          navigate(`/`);
          dispatch(setUserBalance(balance - amount * 100));
        } else {
          setLoading(false);
          const body = await res.json();
          setError('An unknown error occured while donating.');
          console.log('Generic donation error', body);
        }
      })
      .catch((e) => {
        console.log('Error occured while donating', e);
        setLoading(false);
        setError('Unknown error occured while donating.');
      });
  }, [navigate, note, amount, balance, dispatch]);

  return (
    <Container my={3}>
      <Stack spacing={3}>
        <Skeleton isLoaded={!loading}>
          <Stack spacing={3}>
            <Flex align="center" gap="2">
              <Heading>Donate</Heading>
              <Help header={'Donate'} text={help_text} size="sm"></Help>
            </Flex>
          </Stack>
        </Skeleton>
        {error && (
          <Alert status="error" variant="left-accent">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Skeleton isLoaded={!loading} as={Stack} spacing={3}>
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

export default Donate;
