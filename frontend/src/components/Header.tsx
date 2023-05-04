import {
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  Link,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { selectAuthCredentials } from 'src/api/auth';
import fetchClient from 'src/api/fetch';
import {
  selectUser,
  selectUserIsAdmin,
  selectUserIsDonator,
  setUserData,
} from 'src/api/user';
import { socket } from 'src/App';
import store from 'src/store';
import { AdminBadge, DonatorBadge } from './Badges';
import Notifications from './Notifications';
import Wordmark from './Wordmark';

/** The header of the site. */
const Header = () => {
  const auth = useSelector(selectAuthCredentials);
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectUserIsAdmin);
  const isDonator = useSelector(selectUserIsDonator);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  // Fetch the user from the API on header mount.
  useEffect(() => {
    fetchClient('/api/user', {
      method: 'GET',
    })
      .then(async (data) => {
        const body = await data.json();
        if (data.ok) {
          // Set user data to received user resource.
          dispatch(setUserData(body));

          // If the user data is valid, submit login over the socket.
          if (body)
            socket.emit('login', selectAuthCredentials(store.getState()));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [auth, dispatch]);

  return (
    <>
      <Container maxW="container.xl" py="3">
        <Flex direction="row" align="center" justify="space-between">
          <Flex align="center" gap={12}>
            <Link as={RouterLink} to="/">
              <Heading display="inline" size="lg">
                <Wordmark />
              </Heading>
            </Link>
            <Flex align="center" gap={5}>
              <Link as={RouterLink} to="/programs">
                <Heading display="inline" size="md">
                  Programs
                </Heading>
              </Link>
              {isDonator && (
                <Link as={RouterLink} to="/donate">
                  <Heading display="inline" size="md">
                    Donate <DonatorBadge />
                  </Heading>
                </Link>
              )}
              {isAdmin && (
                <>
                  <Link as={RouterLink} to="/user/search">
                    <Heading display="inline" size="md">
                      Users <AdminBadge />
                    </Heading>
                  </Link>
                  <Link as={RouterLink} to="/admin/donations">
                    <Heading display="inline" size="md">
                      Donations <AdminBadge />
                    </Heading>
                  </Link>
                </>
              )}
              <Link as={RouterLink} to="/about">
                <Heading display="inline" size="md">
                  Help Manual
                </Heading>
              </Link>
            </Flex>
          </Flex>
          {loading ? (
            <Button colorScheme="blue" isLoading>
              Login
            </Button>
          ) : user == null ? (
            <Button colorScheme="blue" as={RouterLink} to="/login">
              Login
            </Button>
          ) : (
            <Flex align="center" gap={3}>
              <Notifications />
              <Link as={RouterLink} to="/user">
                {user.first_name} {user.last_name}
              </Link>
              {user.donator && (
                <Text color="whiteAlpha.500">
                  ${(user.balance / 100).toFixed(2)}
                </Text>
              )}
            </Flex>
          )}
        </Flex>
      </Container>
      <Divider />
    </>
  );
};

export default Header;
