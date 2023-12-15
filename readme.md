# Forum Application Setup Guide

## Introduction
This guide provides instructions on setting up and running the Forum Application, a web platform featuring user authentication, forum discussions, weather information, TV show details, and more.

## Prerequisites
- Node.js installed on your system.
- A SQL database set up (e.g., MySQL).
- Access to terminal or command prompt.

## Installation Steps

### 1. Clone the Repository
First, clone the repository to your local machine using Git.

- ```bash
- git clone https://github.com/RizzaMaratas/genshinguild.git
- cd genshinguild

### 2. Install Dependencies
Navigate to the root directory of the project and install the required Node.js dependencies.

### 3. Database Configuration
Set up your SQL database.
Create the necessary tables (userDetails, threads, user_votes, etc.).
Refer to create_db.sql for database and tables information.

### 4. Setting Environment Variables
Set up the required environment variables, including:
Database connection details (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).
Any other API keys required (e.g., OpenWeatherMap API key for weather information).

### 5. Start the Server
Run the Node.js server using the following command:
- npm start
The application should now be running and accessible via http://localhost:[port], where [port] is the port number specified in your application settings.

# Features
User Authentication: Users can register, log in, and log out. Sessions are managed securely.
Forum Discussions: Users can create, view, edit, and delete forum threads.
Weather Information: Users can view weather details by entering a city name. This utilizes the OpenWeatherMap API.
TV Show Information: Users can search for TV shows and view details, including episode counts, using the TVMaze API.

# Usage
Navigate to the application URL in your web browser.
Register for a new account or log in with existing credentials.
Explore forum threads or create new ones.
Use the 'Weather' and 'TV Shows' features to fetch external data.

# Troubleshooting
If you encounter any issues:

Check that all environment variables are set correctly.
Ensure the database is configured and running.
Look at the console for any error messages that can help diagnose issues.