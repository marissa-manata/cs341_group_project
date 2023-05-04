# Non-profit Organization's Bookkeeping Website
## CS341 - Software Design IV
### September 2022 - December 2022

#### About
This website was a group project that involved the description that a non-profit organization needs to keep a record of the participants in relates to various events and programs. The participants include the donor, the volunteer, and the others. The following are the requirements and assumptions for the problem:
- The non-profit organization operates in the way of event driven throughout the year.
- There are four types of users for this system - *Administrator*, *Donor*, *Volunteer*, and *Other*. First three types of users must have an account to login into the system.
- The others can view the various events and programs hosted in this organization and can choose to create an account to become a donor or volunteer.
- An administrator can create and maintain (modify and/or delete) the accounts for everybody in the system including other administrators. All administrators will have equal privileges.
- The administrer will be able to do some simple data analysis and reports.
- The donor will be able to make restricted donation to a certain event/program or unrestricted donation. The donor can also simply attend an event without make any contribution.
- The volunteer can register to help an event at certain time slot or help program activities.
- An event can be associated with zero, one or more programs.

The following minimal set of functionalities must be implemented:
- Provisions to add, search, remove, modify, and view different types of users except "the others"
- Provisions to add, search, remove, modify, and view an ecent or program.
A graphical user interface must be developed for this software. The interface must consist of multiple screens for different tasks.

Given that this project was a group project, we used an AGILE approach to complete the project. We worked in week long sprints and would meet weekly to communicate on any advancements and problems we were facing. We, also, communicated through Discord and used GitHub to keep each other updated on progress we each had made.

#### Languages and Frameworks used
- React - Frontend work
- PostgreSQL & pgAdmin - Database work 
- Node.js & Express - Backend work

#### What is Included
- Frontend of website - `frontend` directory
- Backend of website - `backend` directory
- UML and ER Diagrams - database design
