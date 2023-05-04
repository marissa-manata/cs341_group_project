import { BellIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertDescription,
  Avatar,
  Box,
  Flex,
  IconButton,
  Link,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo } from 'react';
import fetchClient from 'src/api/fetch';
import { useStatefulFetchResource } from 'src/api/hooks';
import { socket } from 'src/App';
import { AdminBadge } from './Badges';
import RouterLink from './RouterLink';

/** A notification that is sent to a user. */
export type Notification = {
  id: string;
  user: string;
  timestamp: string;
  content: string;
  from?: string;
  from_first_name?: string;
  from_last_name?: string;
  unread: boolean;
};

/** The component used to render a `Notification`. */
const NotificationStyle: React.FC<Notification> = (n) => {
  // calculate and memoize ISO8601 timestamp to readable timestamp
  const ts = useMemo(
    () => moment(n.timestamp).format('MMM Do YYYY, h:mm A'),
    [n.timestamp]
  );

  return (
    <Box>
      <Alert status="info" variant={n.unread ? 'left-accent' : 'subtle'}>
        <AlertDescription>
          <Stack spacing={2}>
            {n.from && (
              <Flex align="center" gap={2}>
                <Avatar
                  name={`${n.from_first_name} ${n.from_last_name}`}
                  size="xs"
                />
                <Link as={RouterLink} to={`/user/${n.from}`}>
                  <b>
                    {n.from_first_name} {n.from_last_name}
                  </b>
                </Link>{' '}
                <AdminBadge />
              </Flex>
            )}
            <Text>{n.content}</Text>
            <Text size="sm" color="whiteAlpha.500">
              {ts}
            </Text>
          </Stack>
        </AlertDescription>
      </Alert>
    </Box>
  );
};

/**
 * The notifications tray in the header.
 * Responsible for fetching notifications and displaying them.
 */
const Notifications = () => {
  const toast = useToast();
  const { onOpen, onClose, isOpen } = useDisclosure();

  // fetch and store notifications
  const [notifications, setNotifications] = useStatefulFetchResource<
    Notification[]
  >('/api/user/notifications');

  // calculate unread notifications
  const unread = useMemo(
    () => notifications.data?.some((n) => n.unread),
    [notifications.data]
  );

  // on mount, subscribe to socket `notification` event
  useEffect(() => {
    socket.on('notification', (n: Notification) => {
      // when a notification is received, add it to the in-memory notifications list
      setNotifications((ns) => ({ ...ns, data: [n, ...(ns.data ?? [])] }));

      // show a notification onscreen
      toast({
        id: n.id,
        status: 'info',
        title: 'Notification',
        description: n.content,
        duration: 6000,
        isClosable: true,
      });
    });

    return () => {
      // on unmount, unsubscribe from socket event
      socket.removeListener('notification');
    };
  }, [setNotifications, toast]);

  // wrap onClose to mark notifications as read
  const onCloseWrapper = useCallback(() => {
    onClose();
    // if there are any unread notifications...
    if (unread)
      // mark all notifications as read
      fetchClient('/api/user/notifications/read', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
        },
      }).then((res) => {
        if (res.ok)
          // if the request succeeds mark all in-memory notifications as read
          setNotifications((ns) => ({
            ...ns,
            data: (ns.data ?? []).map((n) => ({ ...n, unread: false })),
          }));
      });
  }, [onClose, unread, setNotifications]);

  return (
    <Popover isLazy onOpen={onOpen} onClose={onCloseWrapper} isOpen={isOpen}>
      <PopoverTrigger>
        <IconButton
          aria-label="Notifications"
          icon={<BellIcon />}
          variant={unread ? 'solid' : 'ghost'}
          colorScheme={unread ? 'orange' : undefined}
        />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader>Notifications</PopoverHeader>
        <PopoverBody>
          {notifications.loading ? (
            <>Loading...</>
          ) : !notifications.data || notifications.data.length === 0 ? (
            <Text>No notifications at this time.</Text>
          ) : (
            <Stack spacing={3} my={1} maxH="300" overflowY="auto">
              {notifications.data?.map((n) => (
                <NotificationStyle key={n.id} {...n} />
              ))}
            </Stack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default Notifications;
