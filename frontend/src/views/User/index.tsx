import {
  Button,
  ButtonGroup,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
  ThemingProps,
  Tooltip,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutCredentials } from 'src/api/auth';
import fetchClient from 'src/api/fetch';
import {
  selectUser,
  selectUserLoggedIn,
  setUserData,
  setUserFlag,
  User,
} from 'src/api/user';
import EditorGrid, { EditorField } from 'src/components/EditorGrid';
import RouterLink from 'src/components/RouterLink';
import UserHeader from './components/UserHeader';
import VolunteerList from './components/VolunteerList';
import DonationTable from '../Donations/DonationTable';
import Help from 'src/components/Help';

/** An enroll field. Acts as a wrapper around enrolling as a role.
 * Simply creates a button that enrolls the user as a certain role. */
const Enroll: React.FC<{
  type: keyof User;
  enrolled: boolean;
  colorScheme: ThemingProps['colorScheme'];
}> = ({ type, enrolled, colorScheme }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const onEnroll = useCallback(() => {
    if (loading || enrolled) return;

    setLoading(true);
    fetchClient(`/api/user/enroll?type=${type}`, {
      method: 'PATCH',
      headers: { Accept: 'application/json' },
    }).then((res) => {
      setLoading(false);
      console.log(type);
      if (res.ok) dispatch(setUserFlag({ key: type, value: true }));
    });
  }, [loading, enrolled, dispatch, type]);

  return (
    <EditorField label={type.substring(0, 1).toUpperCase() + type.substring(1)}>
      <Tooltip
        isDisabled={!enrolled}
        label="To unenroll, please contact an admin."
        hasArrow
      >
        <Button
          colorScheme={colorScheme}
          onClick={onEnroll}
          isLoading={loading}
          isDisabled={loading || enrolled}
        >
          {enrolled ? 'Enrolled' : 'Enroll'}
        </Button>
      </Tooltip>
    </EditorField>
  );
};

const volunteerHelp = [
  "Information on all the events you're volunteered for",
  'This information is only visible to you and the admins',
  'Contact an admin to cancel any of your volunteerings',
];
const donateHelp = [
  "Information on all the donations you've made",
  'This information is only visible to you and the admins',
  'If you do not recognize any of these donations, plese contact an admin.',
];

/** The current user page. This is not a user profile. */
const CurrentUserPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isLoggedIn = useSelector(selectUserLoggedIn);

  useEffect(() => {
    if (isLoggedIn === false) navigate('/login');
  }, [isLoggedIn, navigate]);

  const onLogout = useCallback(() => {
    dispatch(setUserData(undefined));
    dispatch(logoutCredentials());
    navigate('/');
  }, [dispatch, navigate]);

  const onViewProfile = useCallback(() => {
    navigate(`/user/${user?.id}`);
  }, [navigate, user?.id]);

  const helpText = useMemo(() => {
    let help = ['This is where you can manage your account details or log off'];
    if (!user?.volunteer)
      help = help.concat(
        'Enroll as a volunteer to volunteer for the events you organization puts on'
      );
    if (!user?.donator)
      help = help.concat(
        "Entoll as a donor to donate to the organization's events and programs, or to the organization as a whole"
      );
    if (!user?.volunteer && !user?.donator)
      help = help.concat(
        'Once you enroll as either a volunteer or a donor you will have to contact an admin to unenroll'
      );
    return help;
  }, [user]);

  return (
    <Container my={3} maxW="container.lg">
      <Stack spacing={4}>
        <UserHeader isLoaded={!!isLoggedIn} user={user}>
          <Button variant="solid" colorScheme="blue" onClick={onViewProfile}>
            Profile
          </Button>
        </UserHeader>
        <Flex align="center" gap="2">
          <Heading size="lg">Settings</Heading>
          <Help header="User Settings" text={helpText} />
        </Flex>
        <EditorGrid>
          <Enroll
            type="volunteer"
            enrolled={!!user?.volunteer}
            colorScheme="red"
          />
          <Enroll
            type="donator"
            enrolled={!!user?.donator}
            colorScheme="green"
          />
          {user?.donator && (
            <>
              <EditorField label="Funds">
                <Flex align="center" gap={3}>
                  <Button as={RouterLink} to="/user/funds">
                    Add funds
                  </Button>
                  <Text>
                    Your balance is <b>${(user.balance / 100).toFixed(2)}</b>.
                  </Text>
                </Flex>
              </EditorField>
            </>
          )}
          <EditorField label="Account actions">
            <ButtonGroup isAttached variant="outline">
              <Button
                variant="solid"
                onClick={useCallback(
                  () => navigate('change-password'),
                  [navigate]
                )}
              >
                Change password
              </Button>
              <Button onClick={onLogout}>Logout</Button>
            </ButtonGroup>
          </EditorField>
        </EditorGrid>
        {user?.volunteer && (
          <>
            <Flex align="center" gap="2">
              <Heading size="lg">Volunteer</Heading>
              <Help header="Volunteer Info" text={volunteerHelp} />
            </Flex>
            <VolunteerList />
          </>
        )}
        {user?.donator && (
          <>
            <Flex align="center" gap="2">
              <Heading size="lg">Donor</Heading>
              <Help header="Donation Info" text={donateHelp} />
            </Flex>
            <DonationTable user={user.id} />
          </>
        )}
      </Stack>
    </Container>
  );
};

export default CurrentUserPage;
