# Concept Tree Visualization App

A web application that integrates with Moodle LMS to display concept trees in a virtual smartphone interface.

## Features

- **Moodle Integration**: Fetches problem data from Moodle 3.7 LMS
- **Virtual Smartphone UI**: Displays app in a smartphone frame (bottom-right corner)
- **Interactive Concept Tree**: Click numbers to see related concepts branch out
- **MySQL Backend**: Stores concept relationships and hierarchies

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js + Express
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7 with PHP 7.1.9

## Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your settings
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up the database:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
5. Start the server:
   ```bash
   npm start
   ```

## Configuration

### Moodle Setup

1. Enable web services in Moodle (Site administration > Advanced features)
2. Create a web service token (Site administration > Plugins > Web services > Manage tokens)
3. Add the token to your `.env` file

### Database Setup

The application requires MySQL 5.7. Run the schema file to create necessary tables.

## Usage

1. Open `http://localhost:3000` in your browser
2. The virtual smartphone UI appears in the bottom-right corner
3. Click any number in the problem to see its concept tree
4. Related concepts branch out like roots from the selected number

## API Endpoints

- `GET /api/problems/:id` - Fetch problem from Moodle
- `GET /api/concepts/:number` - Get concept tree for a number
- `POST /api/concepts` - Add new concept relationship

## License

MIT
