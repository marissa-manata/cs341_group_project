import { Container, Heading, Stack, Text } from '@chakra-ui/react';

/** Our user help manual. */
const AboutManual = () => {
  return (
    <>
      <Container my={3} maxW="container.lg">
        <Stack spacing={3} w="full">
          <Heading>Welcome to the AMAZe event organizer!!</Heading>
          <Text fontSize="lg">
            AMAZe is an AMAZeing organization and bookkeeping software. Using
            AMAZe, an organization can keep track of all their Programs and any
            Events being held. Volunteers can sign up to volunteer for an event
            and Donators can donate to Events, Programs, or to the organization
            as a whole.
          </Text>
          <Heading>Events</Heading>
          <Text fontSize="lg">
            The events for your organization can be found right on the home page
            by clicking the AMAZe logo in the top-left. Events are listed
            in-order chronologically, and {"you'll"} be able to see each events
            name, desciption, location, and starting time. Clicking on any
            events name will bring you to that event page, where {"you'll"} be
            able to see role-specific information for the event, such as
            volunteering information and donation information.
          </Text>
          <Heading>Programs</Heading>
          <Text fontSize="lg">
            Similar to events, clicking on Programs in the top-left will bring
            you to a list of all programs managed by your organization, and
            clicking on each brings you to each programs page. Events can be
            associated with a program in the organization.
          </Text>
          <Heading>Creating and Managing an Account</Heading>
          <Text fontSize="lg">
            In order to volunteer or donate to events, you must enroll as a
            voluneer or donor, and to do that you must have an account. If you
            are not logged into an account you can do so by clicking{' '}
            {'"Log In"'} in the top-right corner of your screen. From there you
            can either click {'"Register"'} to create a new account, or log into
            an already created account.
          </Text>
          <Text fontSize="lg">
            Creating an account on {"it's"} own {"won't"} give you capabilities
            beyond a user who is not logged in. In order to gain access to
            volunteering and donation you must enroll as either a Voluneer or a
            Donor (or both) in your account page. Your account page can be
            acceced in the top-right corner of the screen, where the login
            button used to be. Your profile will also be where you can change
            your password or logout.
          </Text>
          <Heading>Volunteering</Heading>
          <Text fontSize="lg">
            Before volunteering for an event, you must first enroll as a
            volunteer on your account page.
          </Text>
          <Text fontSize="lg">
            When visiting an event page as a volunteer you will have the option
            to volunteer for that event. The event page will tell you how many
            more volunteers this event requires, as well as any prerequisits for
            volunteers. It is the volunteers responsibility to make sure they
            fit the prerequisits set in place.
          </Text>
          <Text fontSize="lg">
            After clicking {'"Volunteer"'} {"you'll"} be asked to select a time
            range to volunteer for. You can leave the options alone to
            voulunteer for the entire duration of the event, or you can choose
            your start & end time for your volunteering.
          </Text>
          <Text fontSize="lg">
            If you need to cancel your volunteering after signing up, cantact an
            admin. A list of all events {"you've"} volunteered for can be seen
            near the bottom of your account page.
          </Text>
          <Heading>Donating</Heading>
          <Text fontSize="lg">
            Once again, in order to donate you must enroll as a donor in your
            account page.
          </Text>
          <Text fontSize="lg">
            In order to donate you must have sufficient funds in your account.
            The button to add funds for donating can be found on your account
            page.
          </Text>
          <Text fontSize="lg">
            As a donor you will have the ability to donate to Events, Programs,
            and directly to the organization as a whole. The button to donate to
            Events and Programs can be found on the respective event/program
            page. Making an {'"Unrestricted"'} donation to the organization can
            be done through the Donate button on the header in the top-left of
            the screen.
          </Text>
          <Text fontSize="lg">
            You can see your donations made to a specific event/program on their
            respective page. A list of all donations {"you've"} made can be seen
            at the bottom of your account page.
          </Text>
          <Heading>Admins</Heading>
          <Text fontSize="lg">
            Admins have the ability to manage the accounts of other users, as
            well as creating new Programs or Events.
          </Text>
        </Stack>
      </Container>
    </>
  );
};

export default AboutManual;
