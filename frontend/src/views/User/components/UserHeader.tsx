import {
  Avatar,
  Badge,
  Flex,
  Heading,
  HStack,
  Skeleton,
  SkeletonCircle,
  Stack,
} from '@chakra-ui/react';
import React from 'react';
import { User } from 'src/api/user';
import {
  AdminBadge,
  DonatorBadge,
  InactiveBadge,
  VolunteerBadge,
} from 'src/components/Badges';

/** The header of a user profile. */
const UserHeader: React.FC<{
  isLoaded?: boolean;
  user?: User;
  children?: React.ReactNode;
}> = ({ isLoaded, user, children }) => {
  return (
    <Flex direction="row" gap={3} align="center">
      <SkeletonCircle size="100px" isLoaded={isLoaded}>
        <Avatar size="xl" name={`${user?.first_name} ${user?.last_name}`} />
      </SkeletonCircle>
      <Skeleton isLoaded={isLoaded} flexGrow="1">
        <Stack spacing={1}>
          <Heading>
            {user?.first_name} {user?.last_name}
          </Heading>
          <HStack spacing={3}>
            {user && !user.active && <InactiveBadge />}
            {user?.admin && <AdminBadge />}
            {user?.donator && <DonatorBadge />}
            {user?.volunteer && <VolunteerBadge />}
            {!user?.admin && !user?.donator && !user?.volunteer && (
              <Badge>Not enrolled</Badge>
            )}
          </HStack>
        </Stack>
      </Skeleton>
      {children}
    </Flex>
  );
};

export default UserHeader;
