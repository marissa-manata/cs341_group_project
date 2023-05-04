import {
  Button,
  Container,
  Flex,
  Heading,
  Skeleton,
  SkeletonText,
  Stack,
} from '@chakra-ui/react';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import {
  selectUserId,
  selectUserIsAdmin,
  selectUserIsDonator,
} from 'src/api/user';
import { AdminBadge, DonatorBadge, InactiveBadge } from 'src/components/Badges';
import Help from 'src/components/Help';
import RemoveButtons, {
  useActiveCallbackResource,
} from 'src/components/RemoveButtons';
import RouterLink from 'src/components/RouterLink';
import { HttpResource, useStatefulFetchResource } from '../../api/hooks';
import ProgramDonationTable from '../Donations/DonationTable';

/** An instance of a donation in the database. */
export type Donation = {
  id: string;
  program: string;
  user: string;
  note?: string;
  amount: number;
  email: string;
  first_name: string;
  last_name: string;
  timestamp: string;
};

/** An instance of a program in the database. */
export type Program = {
  active: boolean;
  id: string;
  name: string;
  description: string;
  donations: Donation[];
};

/** The program context; used by child components of this page. */
export const ProgramContext = React.createContext<HttpResource<Program>>({
  loading: true,
});

/** The program page. The id param dictates which program to render. */
const ProgramPage = () => {
  const { id } = useParams();
  const isAdmin = useSelector(selectUserIsAdmin);
  const isDonator = useSelector(selectUserIsDonator);
  const userId = useSelector(selectUserId);
  const navigate = useNavigate();

  const [program, setProgram] = useStatefulFetchResource<Program>(
    `/api/programs/${id}`
  );
  const onActiveChange = useActiveCallbackResource(setProgram);

  const helpText = useMemo(() => {
    let help = [
      'This is the page for the "' + program.data?.name + '" program',
      'Unfinished?',
    ];
    if (isDonator) {
      help = help.concat(
        'As a donator, this is where you can make a restricted donation to a program'
      );
    }
    return help;
  }, [program.data?.name, isDonator]);

  const onUpdateProgram = useCallback(
    () => navigate(`/programs/${id}/update`),
    [navigate, id]
  );

  return (
    <ProgramContext.Provider value={program}>
      <Container my={3} maxW="container.md">
        <Stack spacing={3}>
          <Skeleton isLoaded={!program.loading}>
            <Flex align="center" justify="space-between" gap={3}>
              <Flex align="center" gap="2">
                <Heading size="2xl">
                  {program.data?.name}{' '}
                  {program.data && !program.data.active && <InactiveBadge />}
                </Heading>
                <Help header="Event Information" text={helpText} />
              </Flex>
              <Flex align="center">
                {isDonator && (
                  <Button colorScheme="green" as={RouterLink} to="donate">
                    Donate
                  </Button>
                )}
              </Flex>
            </Flex>
          </Skeleton>
          <SkeletonText isLoaded={!program.loading} noOfLines={4}>
            {program.data?.description}
          </SkeletonText>
          {isDonator && (
            <Skeleton isLoaded={!program.loading}>
              <Stack spacing={3}>
                <Heading size="md">
                  Your donations <DonatorBadge />
                </Heading>
                <ProgramDonationTable program={id} user={userId} />
              </Stack>
            </Skeleton>
          )}
          {isAdmin && (
            <Skeleton isLoaded={!program.loading}>
              <Stack spacing={3}>
                <Heading size="md">
                  Donators <AdminBadge />
                </Heading>
                <ProgramDonationTable admin program={id} />
                <Heading size="md">
                  Actions <AdminBadge />
                </Heading>
                <Flex align="center" gap={3}>
                  <RemoveButtons
                    endpoint={`/api/programs/${program.data?.id}`}
                    active={program.data?.active ?? true}
                    onActiveChange={onActiveChange}
                    returnTo="/programs"
                  />
                  <Button colorScheme="blue" onClick={onUpdateProgram}>
                    Update
                  </Button>
                </Flex>
              </Stack>
            </Skeleton>
          )}
        </Stack>
      </Container>
    </ProgramContext.Provider>
  );
};

export default ProgramPage;
