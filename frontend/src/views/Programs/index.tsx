import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Link,
  SkeletonText,
  Stack,
  Text,
} from '@chakra-ui/react';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useFetchResource } from 'src/api/hooks';
import { selectUserIsAdmin } from 'src/api/user';
import Help from 'src/components/Help';
import RouterLink from 'src/components/RouterLink';
import { Program } from 'src/views/Programs/Profile';

/** Program list page. */
const ProgramListPage = () => {
  const navigate = useNavigate();
  const programs = useFetchResource<Array<Program>>(`/api/programs`);
  const isAdmin = useSelector(selectUserIsAdmin);

  const onCreateProgram = useCallback(
    () => navigate('/programs/create'),
    [navigate]
  );

  const helpText = useMemo(() => {
    let help = [
      'Here you can see all the individual programs run by your organization',
      'Click on a program below for more information',
    ];
    if (isAdmin)
      help = help.concat(['As an admin you can also create new programs']);
    return help;
  }, [isAdmin]);

  const programsList = useMemo(
    () =>
      programs.data?.map((program) => (
        <React.Fragment key={program.id}>
          <Box borderRadius="md" borderWidth="1px" my={3} px={4} py={3}>
            <Stack spacing={2}>
              <Heading size="lg">
                <Link as={RouterLink} to={`/programs/${program.id}`}>
                  {program.name}
                </Link>
              </Heading>
              <Text>{program.description}</Text>
            </Stack>
          </Box>
        </React.Fragment>
      )),
    [programs.data]
  );

  return (
    <Container my={5} maxW="container.md">
      <Stack spacing={3}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap="2">
            <Heading>Programs</Heading>
            <Help header="Programs" text={helpText}></Help>
          </Flex>
          {isAdmin && (
            <Button colorScheme="blue" onClick={onCreateProgram}>
              Create program
            </Button>
          )}
        </Flex>
        <SkeletonText
          isLoaded={!programs.loading}
          mt="4"
          noOfLines={6}
          spacing="4"
        >
          {programsList}
        </SkeletonText>
      </Stack>
    </Container>
  );
};

export default ProgramListPage;
