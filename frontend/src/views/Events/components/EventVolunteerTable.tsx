import {
  Button,
  Link,
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
import { useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import fetchClient from 'src/api/fetch';
import RouterLink from 'src/components/RouterLink';
import { EventContext } from '..';

/** An event volunteer table. */
const EventVolunteerTable = () => {
  const event = useContext(EventContext);
  const { id } = useParams();

  const [volunteerRemoveLoading, setVolunteerRemoveLoading] = useState<
    string[]
  >([]);

  // the rows of volunteers
  const volunteers = useMemo(
    () =>
      event.data?.volunteers.map((v) => (
        <Tr key={v.user}>
          <Td>
            <Link as={RouterLink} to={`/user/${v.user}`}>
              {v.first_name} {v.last_name}
            </Link>
          </Td>
          <Td>{moment(v.start_time).format('MMM Do YYYY, h:mm A')}</Td>
          <Td>{moment(v.end_time).format('MMM Do YYYY, h:mm A')}</Td>
          <Td>
            <Button
              colorScheme="red"
              size="xs"
              isLoading={volunteerRemoveLoading.includes(v.user)}
              isDisabled={volunteerRemoveLoading.includes(v.user)}
              onClick={() => {
                if (volunteerRemoveLoading.includes(v.user)) return;
                setVolunteerRemoveLoading((s) => [...s, v.user]);
                fetchClient(`/api/events/${id}/volunteers/${v.user}`, {
                  method: 'DELETE',
                  headers: {
                    Accept: 'application/json',
                  },
                })
                  .then((res) => {
                    if (res.ok) {
                      if (event.data)
                        event.data.volunteers = event.data?.volunteers.filter(
                          (x) => x.user !== v.user
                        );
                    } else {
                      console.log('Failed to remove volunteer', res);
                    }
                  })
                  .catch((e) => console.log('Failed to remove volunteer', e))
                  .finally(() => {
                    setVolunteerRemoveLoading((s) =>
                      s.filter((x) => x !== v.user)
                    );
                  });
              }}
            >
              Remove
            </Button>
          </Td>
        </Tr>
      )),
    [event.data, id, volunteerRemoveLoading]
  );

  if (!event.data?.volunteers || event.data.volunteers.length === 0)
    return <Text>There are no volunteers for this event.</Text>;

  return (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Start time</Th>
            <Th>End time</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>{volunteers}</Tbody>
      </Table>
    </TableContainer>
  );
};

export default EventVolunteerTable;
