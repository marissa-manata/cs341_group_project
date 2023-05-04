import {
  Avatar,
  Badge,
  Box,
  Flex,
  Heading,
  Link,
  Text,
} from '@chakra-ui/react';
import React from 'react';
import { User } from 'src/api/user';
import {
  AdminBadge,
  DonatorBadge,
  InactiveBadge,
  VolunteerBadge,
} from 'src/components/Badges';
import RouterLink from 'src/components/RouterLink';

/** The thumbnail for a user profile. Used in user lists. */
const UserThumb: React.FC<User> = ({ id, first_name, last_name, ...user }) => {
  return (
    <Flex align="center" gap={5}>
      <Avatar name={`${first_name} ${last_name}`} />
      <Box>
        <Flex align="center" gap={2}>
          <Link as={RouterLink} to={`/user/${id}`}>
            <Heading
              size="md"
              color={user.active ? undefined : 'whiteAlpha.700'}
            >
              {first_name} {last_name}
            </Heading>
          </Link>
          {!user.active && <InactiveBadge />}
          {user.admin && <AdminBadge />}
          {user.volunteer && <VolunteerBadge />}
          {user.donator && <DonatorBadge />}
          {!user.admin && !user.volunteer && !user.donator && (
            <Badge>Not enrolled</Badge>
          )}
        </Flex>
        <Text color="whiteAlpha.700">{user.email}</Text>
      </Box>
    </Flex>
  );
};

export default UserThumb;
