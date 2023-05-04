import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Container,
  Flex,
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import fetchClient from 'src/api/fetch';
import { selectUserBalanceText, setUserData } from 'src/api/user';

/** The add funds page. */
const AddFunds = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const balance = useSelector(selectUserBalanceText);
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onAmountChange = useCallback(
    (_: string, n: number) => setAmount(n),
    []
  );

  const onAddFunds = useCallback(() => {
    setError(undefined);

    // field validation
    if (amount <= 0) {
      setError('The amount must be greater than $0.00.');
      return;
    }

    // make the request
    setLoading(true);
    fetchClient(`/api/user/funds?amount=${Math.round(amount * 100)}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    })
      .then(async (res) => {
        setLoading(false);
        if (res.ok) {
          dispatch(setUserData(await res.json()));
          navigate('/user');
        } else {
          setError('An unknown error occurred while adding funds.');
        }
      })
      .catch((e) => {
        setLoading(false);
        console.log('Error adding funds', e);
        setError('An unknown error occurred while adding funds.');
      });
  }, [amount, navigate, dispatch]);

  return (
    <Container my={3}>
      <Stack spacing={3}>
        <Heading>Add funds</Heading>
        {error && (
          <Alert status="error" variant="left-accent">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Text>
          Your balance is currently <b>{balance}</b>.
        </Text>
        <Flex align="center" gap={3}>
          <NumberInput
            defaultValue={10}
            onChange={onAmountChange}
            min={0}
            precision={2}
            flexGrow={1}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Button
            onClick={loading ? undefined : onAddFunds}
            isLoading={loading}
            isDisabled={loading}
          >
            Add funds
          </Button>
        </Flex>
        <Text color="whiteAlpha.500">
          By adding funds, we assume you actually have the amount of money
          you&apos;re adding. This is for demonstration purposes!
        </Text>
      </Stack>
    </Container>
  );
};

export default AddFunds;
