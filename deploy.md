# Deployment Documentation

## Prerequisites

Before you begin, ensure your system has the following software installed:

- Node.js (recommended: latest LTS version)
- npm (Node.js package manager, typically installed with Node.js)

## Clone the Project

First, clone the project to your local machine:

```bash
git clone https://github.com/AdventureGoldDao/adventure-layer-bridge-backend.git
cd adventure-layer-bridge-backend
```

## Install Dependencies

In the project directory, run the following command to install all necessary dependencies:

```bash
npm install
```

## Configure Environment Variables

The project uses `dotenv` to manage environment variables. Create a `.env` file in the root directory of the project and configure the following variables as needed:

### Token and Chain Information Configuration

```
# Example
TOKEN_SECRET=yourtokensecret
CHAIN_ID=yourchainid
CHAIN_URL=yourchainurl
```

### Database Configuration

```

# Example
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=yourdatabase
```

Make sure to update these variables according to your database configuration.

## Run the Project

After configuring the environment variables, you can run the project using the following command:

```bash
node <entry-file>.js
```

Replace `<entry-file>` with the name of your project's entry file.

## Run Tests

The project uses `mocha` as the testing framework. Ensure you add `mocha` and `chai` as development dependencies in your `package.json`:

```bash
npm install mocha chai --save-dev
```

Then, you can run the tests using:

```bash
npx mocha test/db_utils.test.js
```

## Log Management

The project uses `winston-daily-rotate-file` for log management. Ensure you correctly set the log path and level in the configuration file.

## Additional Notes

- Ensure the database service is up and running.
- Adjust other configuration files in the project as needed.
