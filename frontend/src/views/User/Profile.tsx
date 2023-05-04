import {
  Container,
  Heading,
  Skeleton,
  Stack,
  Switch,
  ThemingProps,
} from '@chakra-ui/react';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import fetchClient from 'src/api/fetch';
import { useStatefulFetchResource } from 'src/api/hooks';
import {
  selectUserId,
  selectUserIsAdmin,
  setUserFlag,
  User,
} from 'src/api/user';
import EditorGrid, { EditorField, EditorRow } from 'src/components/EditorGrid';
import RemoveButtons, {
  useActiveCallbackResource,
} from 'src/components/RemoveButtons';
import DonationTable from '../Donations/DonationTable';
import UserHeader from './components/UserHeader';
import VolunteerList from './components/VolunteerList';

/** Similar to `Enroll`, provides buttons for changing user roles. Only visible to admins. */
const AdminFlagButton: React.FC<{
  field: keyof User;
  value: boolean;
  name: string;
  color: ThemingProps['colorScheme'];
  onSet: (newValue: boolean) => void;
}> = ({ field, value, name, color, onSet }) => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const userId = useSelector(selectUserId);
  const dispatch = useDispatch();

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (loading) return;
      const checked =
        typeof e.target.checked === 'string'
          ? e.target.checked === 'true'
          : e.target.checked;

      setLoading(true);
      fetchClient(`/api/user/${id}/flag`, {
        method: 'PATCH',
        body: JSON.stringify({
          key: field,
          value: checked,
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then((res) => {
          setLoading(false);
          if (res.ok) onSet(checked);
        })
        .catch((e) => {
          setLoading(false);
          console.log('Failed to flip user flag', e);
        });
      if (id == userId) {
        console.log('Modifying my own properties');
        dispatch(setUserFlag({ key: field, value: !value })); // TODO: Why's this need to be flipped?
      }
    },
    [loading, field, id, onSet, dispatch, userId, value]
  );

  return (
    <EditorField label={name}>
      <Switch
        isChecked={value}
        isDisabled={loading}
        onChange={onChange}
        size="lg"
        colorScheme={color}
      />
    </EditorField>
  );
};

/** The user profile page. */
const UserProfile = () => {
  const { id } = useParams();
  const isAdmin = useSelector(selectUserIsAdmin);

  const [user, setUser] = useStatefulFetchResource<User>(`/api/user/${id}`);
  const onActiveChange = useActiveCallbackResource(setUser);

  return (
    <Container my={3} maxW="container.lg">
      <Stack spacing={3}>
        <UserHeader user={user.data} isLoaded={!user.loading} />
        {isAdmin && (
          <Skeleton isLoaded={!user.loading}>
            <Stack spacing={3}>
              <Heading size="lg">Admin</Heading>
              {user.data?.volunteer && (
                <>
                  <Heading size="md" my={3}>
                    Volunteer registrations
                  </Heading>
                  <VolunteerList id={user.data.id} />
                </>
              )}
              {user.data?.donator && (
                <>
                  <Heading size="md" my={3}>
                    Donations
                  </Heading>
                  <DonationTable admin user={id} />
                </>
              )}
              <EditorGrid>
                <EditorRow>
                  <Heading size="md" my={3}>
                    Roles
                  </Heading>
                </EditorRow>
                <AdminFlagButton
                  field="volunteer"
                  name="Volunteer"
                  value={!!user.data?.volunteer}
                  color="red"
                  onSet={(value) =>
                    setUser((u) => ({
                      ...u,
                      data: u.data && { ...u.data, volunteer: value },
                    }))
                  }
                />
                <AdminFlagButton
                  field="donator"
                  name="Donator"
                  value={!!user.data?.donator}
                  color="green"
                  onSet={(value) =>
                    setUser((u) => ({
                      ...u,
                      data: u.data && { ...u.data, donator: value },
                    }))
                  }
                />
                <AdminFlagButton
                  field="admin"
                  name="Admin"
                  value={!!user.data?.admin}
                  color="blue"
                  onSet={(value) =>
                    setUser((u) => ({
                      ...u,
                      data: u.data && { ...u.data, admin: value },
                    }))
                  }
                />
                <EditorRow>
                  <Heading size="md" my={3}>
                    Account administration
                  </Heading>
                </EditorRow>
                <EditorField label="Account">
                  <RemoveButtons
                    endpoint={`/api/user/${user.data?.id}`}
                    active={user.data?.active ?? true}
                    onActiveChange={onActiveChange}
                    returnTo="/admin/users"
                  />
                </EditorField>
              </EditorGrid>
            </Stack>
          </Skeleton>
        )}
      </Stack>
    </Container>
  );
};

export default UserProfile;
