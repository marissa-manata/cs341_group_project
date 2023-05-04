import { Button, Container, Flex, Heading, Stack } from '@chakra-ui/react';
import RouterLink from 'src/components/RouterLink';
import DonationTable from './DonationTable';

const AdminDonations = () => {
  return (
    <Container my={3} maxW="container.lg">
      <Stack spacing={3}>
        <Flex align="center" justify="space-between">
          <Heading>Donations</Heading>
          <Button as={RouterLink} to="summary">
            Summary
          </Button>
        </Flex>
        <DonationTable admin />
      </Stack>
    </Container>
  );
};

export default AdminDonations;
