import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Link,
  Stack,
  Text,
  Flex,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { storeCredentials } from 'src/api/auth';
import { useInputState } from 'src/api/hooks';
import { selectUserLoggedIn } from 'src/api/user';
import RouterLink from 'src/components/RouterLink';
import Help from 'src/components/Help';

/** The login page. */
const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userLoggedIn = useSelector(selectUserLoggedIn);
  const email = useInputState('');
  const password = useInputState('');
  const remember = useInputState(false, 'checked');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onLogin = useCallback(() => {
    if (loading) return;

    setLoading(true);
    fetch('/api/user', {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(`${email.value}:${password.value}`)}`,
      },
    })
      .then(async (res) => {
        setLoading(false);
        if (res.ok) {
          dispatch(
            storeCredentials({
              email: email.value,
              password: password.value,
              remember: remember.value,
            })
          );
          navigate('/');
        } else {
          const data = await res.json();
          if (data?.error === 'invalid_credentials')
            setError('Invalid email or password.');
          else setError('Unknown error occurred while logging in.');
        }
      })
      .catch(async (err) => {
        setLoading(false);
        console.log('Error logging in', err);
        setError('Unknown error occurred while requesting to log in.');
      });
  }, [
    email.value,
    password.value,
    remember.value,
    dispatch,
    loading,
    navigate,
  ]);

  useEffect(() => {
    if (userLoggedIn) navigate('/');
  }, [userLoggedIn, navigate]);

  const helpText = [
    "Enter your account information into the fields bellow, then press 'login' to login to your account",
    "Selecting 'Remember me' will keep you logged in between sessions",
    "If you do not have an account, you can click on 'register' to go to the account registration page",
  ];

  return (
    <Container my={3}>
      <Stack spacing={3} w="full">
        <Flex alignItems="center" gap="2">
          <Heading>Login</Heading>
          <Help header="Login" text={helpText}></Help>
        </Flex>
        <Text>
          If you do not have an account already, please{' '}
          <Link as={RouterLink} to="/register" color="blue.300">
            register
          </Link>
        </Text>
        {error && (
          <Alert status="error" variant="left-accent">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormControl>
          <FormLabel>Email address</FormLabel>
          <Input type="email" {...email.props} />
        </FormControl>
        <FormControl isInvalid={error === 'invalid_credentials'}>
          <FormLabel>Password</FormLabel>
          <Input type="password" {...password.props} />
          {error === 'invalid_credentials' && (
            <FormErrorMessage>
              Invalid Credentials. Double-check email & password
            </FormErrorMessage>
          )}
        </FormControl>
        <Checkbox {...remember.props}>Remember me</Checkbox>
        <Button
          w="full"
          disabled={!email.value || !password.value || loading}
          onClick={
            email.value && password.value && !loading ? onLogin : undefined
          }
          colorScheme="blue"
          isLoading={loading}
        >
          Login
        </Button>
      </Stack>
    </Container>
  );
};

export default Login;
