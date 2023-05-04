import {
  Alert,
  AlertDescription,
  AlertIcon,
  Link,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import moment from 'moment';
import React, { useMemo } from 'react';
import { useFetchResource } from 'src/api/hooks';
import RouterLink from 'src/components/RouterLink';
import { Volunteer } from 'src/views/Events';

/** The volunteer list for a user profile. */
const VolunteerList: React.FC<{ id?: string }> = ({ id }) => {
  const resource = useFetchResource<(Volunteer & { event_name: string })[]>(
    `/api/user/volunteer${id ? `?id=${id}` : ''}`
  );

  const rows = useMemo(
    () =>
      resource.data?.map((v) => (
        <Tr key={v.event}>
          <Td>
            <Link as={RouterLink} to={`/events/${v.event}`}>
              {v.event_name}
            </Link>
          </Td>
          <Td>{moment(v.start_time).format('MMM Do YYYY, h:mm A')}</Td>
          <Td>{moment(v.end_time).format('MMM Do YYYY, h:mm A')}</Td>
        </Tr>
      )),
    [resource.data]
  );

  if (resource.loading) return <Spinner />;
  if (resource.error && !resource.data)
    return (
      <Alert status="error" variant="left-accent">
        <AlertIcon />
        <AlertDescription>
          Failed to load volunteer registrations!
        </AlertDescription>
      </Alert>
    );

  if (resource.data?.length === 0)
    return <Text>You have not volunteered for any events.</Text>;

  return (
    <>
      <Text>Below is a list of the events you have volunteered for.</Text>
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Event</Th>
              <Th>Volunteer start</Th>
              <Th>Volunteer end</Th>
            </Tr>
          </Thead>
          <Tbody>{rows}</Tbody>
        </Table>
      </TableContainer>
    </>
  );
};

export default VolunteerList;
