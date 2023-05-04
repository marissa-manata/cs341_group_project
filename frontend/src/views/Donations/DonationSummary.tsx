import {
  Alert,
  AlertDescription,
  AlertIcon,
  Checkbox,
  Container,
  Flex,
  FormControl,
  FormLabel,
  GridItem,
  Heading,
  Input,
  Link,
  SimpleGrid,
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
import { useMemo } from 'react';
import { useFetchResource, useInputState } from 'src/api/hooks';
import { AdminBadge } from 'src/components/Badges';
import Help from 'src/components/Help';
import RouterLink from 'src/components/RouterLink';

type SummaryItem = {
  total: number;
  id: string;
  first_name: string;
  last_name: string;
  admin: boolean;
};

const SUMMARY_HELP = [
  'This page will allow you to see all donators and their total donations in the system.',
  'Checking the "Only show over a time span" checkbox will allow you to specify a certain ' +
    'time range to view donations over.',
];

/** Admin donation summary page. */
const DonationSummary = () => {
  const startTime = useInputState('');
  const endTime = useInputState('');
  const useSpan = useInputState(false, 'checked');
  const resource = useFetchResource<SummaryItem[]>(
    `/api/donations/summary${
      useSpan && startTime.value && endTime.value
        ? `?from=${startTime.value}&to=${endTime.value}`
        : ''
    }`
  );

  // if the current input times are incorrect
  const timesIncorrect = useMemo(() => {
    try {
      return (
        useSpan.value &&
        Date.parse(startTime.value) >= Date.parse(endTime.value)
      );
    } catch {
      return false;
    }
  }, [useSpan.value, startTime.value, endTime.value]);

  return (
    <Container my={3} maxW="container.lg">
      <Stack spacing={3}>
        <Flex align="center" gap={2}>
          <Heading>Donator summary</Heading>
          <Help size="sm" header="Donator summary" text={SUMMARY_HELP} />
        </Flex>
        <Text>
          View a summary of all donators in the system. Optionally, specify a
          time span to view a donation summary from.
        </Text>
        <SimpleGrid columns={2} spacing={3}>
          <GridItem colSpan={2}>
            <FormControl>
              <FormLabel>Time span</FormLabel>
              <Checkbox {...useSpan.props}>Only show over a time span</Checkbox>
            </FormControl>
          </GridItem>
          {useSpan.value && (
            <>
              <FormControl>
                <FormLabel>Summary start time</FormLabel>
                <Input type="datetime-local" {...startTime.props} />
              </FormControl>
              <FormControl>
                <FormLabel>Summary end time</FormLabel>
                <Input type="datetime-local" {...endTime.props} />
              </FormControl>
            </>
          )}
        </SimpleGrid>
        {timesIncorrect && (
          <Alert variant="left-accent" status="error">
            <AlertIcon />
            <AlertDescription>
              The start time should come after the end time.
            </AlertDescription>
          </Alert>
        )}
        <Skeleton isLoaded={!resource.loading}>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Donator</Th>
                  <Th isNumeric>Amount</Th>
                </Tr>
              </Thead>
              <Tbody>
                {resource.data?.map((item) => (
                  <Tr key={item.id}>
                    <Td>
                      <Link as={RouterLink} to={`/user/${item.id}`}>
                        {item.first_name} {item.last_name}{' '}
                        {item.admin && <AdminBadge />}
                      </Link>
                    </Td>
                    <Td isNumeric>
                      <Text color={item.total == 0 ? 'gray' : undefined}>
                        $
                        {(item.total / 100).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </Text>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Skeleton>
      </Stack>
    </Container>
  );
};

export default DonationSummary;
