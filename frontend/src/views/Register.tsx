import {
  Button,
  Checkbox,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  GridItem,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  useToast,
} from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { storeCredentials } from 'src/api/auth';
import { useInputState } from 'src/api/hooks';

/** The register page. */
const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  // field state
  const firstName = useInputState('');
  const lastName = useInputState('');
  const email = useInputState('');
  const password = useInputState('');
  const confirmPassword = useInputState('');
  const remember = useInputState(false, 'checked');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const onRegister = useCallback(() => {
    // field validation
    if (password.value !== confirmPassword.value) {
      setError('The passwords do not match.');
      return;
    }

    // make the payload
    const body = {
      email: email.value,
      first_name: firstName.value,
      last_name: lastName.value,
      password: password.value,
    };

    // make the request
    setLoading(true);
    fetch('/api/user', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setError(body['error']);
        } else {
          // register success
          dispatch(
            storeCredentials({
              email: email.value,
              password: password.value,
              remember: remember.value,
            })
          );
          navigate('/');
          toast({
            title: 'Welcome!',
            description: `You've been registered, ${firstName.value}.`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        }
      })
      .catch((_e) => {
        setError('unknown');
      })
      .finally(() => setLoading(false));
  }, [
    email.value,
    firstName.value,
    lastName.value,
    password.value,
    remember.value,
    confirmPassword.value,
    dispatch,
    navigate,
    toast,
  ]);

  return (
    <Container my={3}>
      <Stack spacing={3} w="full">
        <Heading>Register an account</Heading>
        <SimpleGrid columns={2} columnGap={3} rowGap={3}>
          <GridItem>
            <FormControl>
              <FormLabel>First name</FormLabel>
              <Input type="text" {...firstName.props} />
            </FormControl>
          </GridItem>
          <GridItem>
            <FormControl>
              <FormLabel>Last name</FormLabel>
              <Input type="text" {...lastName.props} />
            </FormControl>
          </GridItem>
          <GridItem colSpan={2}>
            <FormControl isInvalid={error === 'email_in_use'}>
              <FormLabel>Email address</FormLabel>
              <Input type="email" {...email.props} />
              {error === 'email_in_use' && (
                <FormErrorMessage>
                  This email address is already in use
                </FormErrorMessage>
              )}
            </FormControl>
          </GridItem>
          <GridItem colSpan={2}>
            <FormControl
              isInvalid={
                confirmPassword.value !== '' &&
                password.value !== confirmPassword.value
              }
            >
              <FormLabel>Password</FormLabel>
              <Stack spacing={3}>
                <Input
                  type="password"
                  placeholder="Password"
                  {...password.props}
                />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  {...confirmPassword.props}
                />
              </Stack>
              <FormErrorMessage>Passwords do not match.</FormErrorMessage>
            </FormControl>
          </GridItem>
          <GridItem colSpan={2}>
            <Checkbox {...remember.props}>Remember me</Checkbox>
          </GridItem>
        </SimpleGrid>
        <Button
          w="full"
          colorScheme="blue"
          isLoading={loading}
          disabled={
            !firstName.value ||
            !lastName.value ||
            !email.value ||
            !password.value ||
            !confirmPassword.value ||
            password.value !== confirmPassword.value ||
            loading
          }
          onClick={
            firstName.value &&
            lastName.value &&
            email.value &&
            password.value &&
            confirmPassword.value &&
            password.value === confirmPassword.value &&
            !loading
              ? onRegister
              : undefined
          }
        >
          Register
        </Button>
      </Stack>
    </Container>
  );
};

export default Register;
