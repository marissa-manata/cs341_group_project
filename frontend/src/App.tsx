import { Outlet, Route, Routes } from 'react-router-dom';
import { io } from 'socket.io-client';
import Header from './components/Header';
import SearchPage, {
  EVENT_FILTERS,
  USER_FILTERS,
} from './components/SearchPage';
import AboutManual from './About';
import AdminDonations from './views/Donations/AdminDonations';
import Donate from './views/Donations/Donate';
import EventPage from './views/Events';
import EventCreatePage from './views/Events/Create';
import EventDonate from './views/Events/Donate';
import EventVolunteer from './views/Events/Volunteer';
import Home, { EventThumb } from './views/Home';
import Login from './views/Login';
import ProgramCreatePage from './views/Programs/Create';
import ProgramDonate from './views/Programs/Donate';
import ProgramListPage from './views/Programs/index';
import ProgramPage from './views/Programs/Profile';
import ProgramUpdatePage from './views/Programs/Update';
import Register from './views/Register';
import CurrentUserPage from './views/User';
import AddFunds from './views/User/AddFunds';
import ChangePassword from './views/User/ChangePassword';
import UserThumb from './views/User/components/UserThumb';
import UserProfile from './views/User/Profile';
import DonationSummary from './views/Donations/DonationSummary';

const Layout = () => (
  <>
    <Header />
    <Outlet />
  </>
);

export const socket = io();

/**
 * The top-level component for our program.
 *
 * This handles the router, which allows us to set which paths go to which pages.
 * All page definitions are set from this component.
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="donate" element={<Donate />} />
        <Route path="about" element={<AboutManual />} />
        <Route path="events">
          <Route path="create" element={<EventCreatePage />} />
          {/* dynamically created search page for events */}
          <Route
            path="search"
            element={
              <SearchPage
                key="event"
                component={EventThumb}
                title="Events"
                endpoint="/api/events/search"
                filters={EVENT_FILTERS}
              />
            }
          />
          <Route path=":id">
            <Route index element={<EventPage />} />
            <Route path="volunteer" element={<EventVolunteer />} />
            <Route path="donate" element={<EventDonate />} />
          </Route>
        </Route>
        <Route path="programs">
          <Route path="" element={<ProgramListPage />} />
          <Route path="create" element={<ProgramCreatePage />} />
          <Route path=":id">
            <Route index element={<ProgramPage />} />
            <Route path="donate" element={<ProgramDonate />} />
            <Route path="update" element={<ProgramUpdatePage />} />
          </Route>
        </Route>
        <Route path="user">
          <Route index element={<CurrentUserPage />} />
          <Route path="funds" element={<AddFunds />} />
          <Route path="change-password" element={<ChangePassword />} />
          {/* dynamically created search page for users */}
          <Route
            path="search"
            element={
              <SearchPage
                key="user"
                component={UserThumb}
                title="Users"
                endpoint="/api/users/search"
                filters={USER_FILTERS}
                spacing={3}
                admin
              />
            }
          />
          <Route path=":id" element={<UserProfile />} />
        </Route>
        <Route path="admin">
          <Route path="donations">
            <Route index element={<AdminDonations />} />
            <Route path="summary" element={<DonationSummary />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
