import {
  Button,
  Link,
  Skeleton,
  Stack,
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
import React, { useMemo, useState } from 'react';
import fetchClient from 'src/api/fetch';
import { useFetchResource } from 'src/api/hooks';
import { User } from 'src/api/user';
import { EventBadge, ProgramBadge } from 'src/components/Badges';
import RouterLink from 'src/components/RouterLink';
import { Event } from '../Events';
import { Program } from '../Programs/Profile';

/** An instance of a donation from the database. */
export type Donation = {
  id: string;
  amount: number;
  note?: string;
  timestamp: string;

  user: string;
  event?: string;
  program?: string;

  userData: User;
  eventData: Event;
  programData: Program;
};

/** A donation table component. The props are used to change the context of the table. */
const DonationTable: React.FC<{
  admin?: boolean;
  event?: string;
  program?: string;
  user?: string;
}> = ({ admin, event, program, user }) => {
  // grab donations from the endpoint
  const donations = useFetchResource<Donation[]>(
    `/api${
      event
        ? '/events/' + event
        : program
        ? '/programs/' + program
        : user
        ? admin
          ? '/user/' + user
          : '/user'
        : ''
    }/donations${user && !admin ? '?only=user' : ''}`
  );

  // total up the donations
  const total = useMemo(
    () => donations.data?.map((d) => d.amount).reduce((p, c) => p + c, 0) ?? 0,
    [donations.data]
  );

  const [refundLoading, setRefundLoading] = useState<string[]>([]);
  const [refundedDonations, setRefundedDonations] = useState<string[]>([]);

  // rows in the table
  const rows = useMemo(
    () =>
      donations.data?.map((d) => (
        <Tr key={d.user}>
          {admin && !user && (
            <Td>
              <Link as={RouterLink} to={`/user/${d.user}`}>
                {d.userData.first_name} {d.userData.last_name}
              </Link>
            </Td>
          )}
          <Td>
            $
            {(d.amount / 100).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Td>
          <Td>
            {d.note ?? (
              <Text as="i" color="whiteAlpha.500">
                No note
              </Text>
            )}
          </Td>
          {(user || admin) && !event && !program && (
            <Td>
              {d.event || d.program ? (
                <Link
                  as={RouterLink}
                  to={`/${d.event ? 'events' : 'programs'}/${
                    d.event || d.program
                  }`}
                >
                  {d.event ? <EventBadge /> : <ProgramBadge />}{' '}
                  {d.eventData?.name ?? d.programData?.name}
                </Link>
              ) : (
                <Text as="i" color="whiteAlpha.500">
                  Unrestricted
                </Text>
              )}
            </Td>
          )}
          <Td>{moment(d.timestamp).format('MMM Do YYYY, h:mm A')}</Td>
          {admin && (
            <Td>
              {refundedDonations.includes(d.id) ? (
                <>
                  <Text as="i" color="whiteAlpha.500">
                    Refunded
                  </Text>
                </>
              ) : (
                <>
                  <Button
                    colorScheme="blue"
                    size="xs"
                    isLoading={refundLoading.includes(d.id)}
                    isDisabled={refundLoading.includes(d.id)}
                    onClick={() => {
                      if (refundLoading.includes(d.id)) return;
                      setRefundLoading((s) => [...s, d.id]);
                      fetchClient(`/api/donations/${d.id}`, {
                        method: 'DELETE',
                        headers: {
                          Accept: 'application/json',
                        },
                      })
                        .then((res) => {
                          if (res.ok) {
                            setRefundedDonations((s) => [...s, d.id]);
                          } else {
                            console.log('failed to refund donation', res);
                          }
                        })
                        .catch((e) =>
                          console.log('failed to refund donation', e)
                        )
                        .finally(() => {
                          setRefundLoading((s) => s.filter((x) => x !== d.id));
                        });
                    }}
                  >
                    Refund
                  </Button>
                </>
              )}
            </Td>
          )}
        </Tr>
      )),
    [admin, donations, refundLoading, refundedDonations, user, event, program]
  );

  // subtext above the table
  const subtext = useMemo(() => {
    const amount = (
      <b>
        ${(total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </b>
    );

    if (admin) {
      if (user) return <>This user has given {amount} in donations.</>;
      if (event) return <>This event has received {amount} in donations.</>;
      if (program) return <>This program has received {amount} in donations.</>;
      return (
        <>
          A total of {amount} has been processed in the system. Of that,{' '}
          <b>
            $
            {(
              (donations.data
                ?.filter((d) => !d.event && !d.program)
                .map((d) => d.amount)
                .reduce((p, c) => p + c, 0) ?? 0) / 100
            ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </b>{' '}
          is unrestricted.
        </>
      );
    } else if (user) {
      if (event) return <>You have donated {amount} to this event.</>;
      if (program) return <>You have donated {amount} to this program.</>;
      return <>You have given {amount} in donations.</>;
    } else return <></>;
  }, [admin, event, total, program, user, donations.data]);

  return (
    <Skeleton isLoaded={!donations.loading}>
      <Stack spacing={3}>
        <Text>{subtext}</Text>
        {donations.data && donations.data.length > 0 && (
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  {admin && !user && <Th>Donator</Th>}
                  <Th>Amount</Th>
                  <Th>Note</Th>
                  {!event && !program && <Th>Event/Program</Th>}
                  <Th>Timestamp</Th>
                  {admin && <Th>Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>{rows}</Tbody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </Skeleton>
  );
};

export default DonationTable;
