import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
} from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { changePassword } from 'src/api/auth';
import fetchClient from 'src/api/fetch';
import { useInputState } from 'src/api/hooks';

/** The change password page. */
const ChangePassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const current = useInputState('');
  const newPass = useInputState('');
  const confirmNewPass = useInputState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onSubmit = useCallback(() => {
    if (newPass.value !== confirmNewPass.value) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    fetchClient('/api/user/password', {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current: current.value,
        new: newPass.value,
      }),
    })
      .then(async (res) => {
        setLoading(false);
        if (res.ok) {
          dispatch(changePassword(newPass.value));
          navigate('/user');
        } else {
          const body = await res.json();
          if (body.error === 'invalid_password')
            setError('Current password is incorrect.');
          else {
            setError('Failed to change password.');
            console.log('Password change fail', res);
          }
        }
      })
      .catch((e) => {
        setLoading(false);
        setError('Failed to change password.');
        console.log('Password change fail', e);
      });
  }, [current.value, newPass.value, confirmNewPass.value, dispatch, navigate]);

  return (
    <Container my={3}>
      <Stack spacing={3}>
        <Heading>Change Password</Heading>
        {error && (
          <Alert variant="left-accent" status="error">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormControl>
          <FormLabel>Current password</FormLabel>
          <Input
            type="password"
            placeholder="Current password"
            {...current.props}
          />
        </FormControl>
        <FormControl
          isInvalid={
            confirmNewPass.value !== '' &&
            newPass.value !== confirmNewPass.value
          }
        >
          <FormLabel>New password</FormLabel>
          <Stack spacing={3}>
            <Input
              type="password"
              placeholder="New password"
              {...newPass.props}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              {...confirmNewPass.props}
            />
          </Stack>
          <FormErrorMessage>Passwords do not match.</FormErrorMessage>
        </FormControl>
        <Button
          w="full"
          colorScheme="blue"
          isLoading={loading}
          isDisabled={
            loading ||
            !current.value ||
            !newPass.value ||
            !confirmNewPass.value ||
            newPass.value !== confirmNewPass.value
          }
          onClick={
            current.value &&
            newPass.value &&
            confirmNewPass.value &&
            newPass.value === confirmNewPass.value
              ? onSubmit
              : undefined
          }
        >
          Change password
        </Button>
      </Stack>
    </Container>
  );
};

export default ChangePassword;
