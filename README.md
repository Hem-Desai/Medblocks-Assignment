# MedBlock - Patient Registration App

A frontend-only patient registration application using PGlite for data storage and persistence.

## Features

- Register new patients with validation
- Query records using raw SQL
- Data persistence across page refreshes
- Cross-tab synchronization for real-time updates

## Technology Stack

- **Frontend**: React with TypeScript
- **Database**: PGlite (PostgreSQL in the browser) with SQL.js fallback
- **Storage**: IndexedDB for persistence
- **Styling**: TailwindCSS
- **Build Tool**: Vite

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Build for production:
   ```
   npm run build
   ```

## Usage

### Patient Registration

Fill out the patient registration form with the following information:
- Full Name
- Age
- Gender
- Date of Birth
- Address

Click "Register Patient" to save the patient to the database.

### SQL Query Interface

Use the SQL Query Interface to run custom SQL queries against the patient database:
- Type your SQL query in the text area
- Click "Execute Query" to run the query
- View results in the table below
- Use "Show All Patients" for a quick way to view all records

## Cross-Tab Synchronization

The application supports usage across multiple tabs in the same browser:
- Changes made in one tab are automatically reflected in other open tabs
- Data is synchronized using the BroadcastChannel API
- All tabs share the same underlying SQLite database stored in IndexedDB

## Development Challenges

- **PostgreSQL in the Browser**: Implementing PGlite with proper persistence required careful handling of WebAssembly loading and fallback mechanisms.
- **Cross-Tab Synchronization**: Ensuring data consistency across multiple tabs required implementing a robust messaging system with the BroadcastChannel API and custom events.
- **Date Formatting**: Converting ISO date strings to user-friendly formats required implementing a migration utility that runs on application startup.
- **WebAssembly Loading**: Handling WebAssembly loading issues with PGlite required creating a SQL.js wrapper with a PGlite-compatible API.

## Deployment

The application is deployed to Netlify at: [MedBlock App](https://medblock-patient-registration.netlify.app/)

The deployment process includes:
1. Building the React application with Vite
2. Copying WebAssembly files to the build output
3. Configuring Netlify to handle SPA routing

You can deploy your own instance by:

```bash
npm run build
npx netlify deploy --prod
```

## License

MIT
