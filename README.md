# School Event Registration

A school event registration system built with React, TypeScript, Express, MySQL, Nginx, Docker, and Jenkins CI/CD.

#Members Included:
* Karl Laxamana
* Angelo Barazon
* Joshua Tanglao
* Martin Villanueva

## Technology Stack

* Frontend: React + Vite + TypeScript
* Backend: Node.js + Express
* Database: MySQL
* Web Server: Nginx
* Containerization: Docker
* CI/CD: Jenkins
* Source Control: Git + GitHub

## Project Structure

```text
event-registration/
├── backend/
├── frontend/
├── nginx/
├── Dockerfile
├── Jenkinsfile
├── .gitignore
└── README.md
```

## Run Locally

### 1. Start MySQL

Make sure MySQL/MariaDB is running through XAMPP.

Create the database:

```sql
CREATE DATABASE event_registration;
```

The backend automatically creates the required tables and sample data when it starts.

### 2. Start the Backend

Open PowerShell:

```powershell
cd backend
npm install
npm start
```

The backend runs on:

```text
http://localhost:3000
```

Backend configuration can be provided using the `.env` file based on `.env.example`.

### 3. Start the Frontend

Open another PowerShell window:

```powershell
cd frontend
npm install
npm run dev
```

Vite will display the frontend development URL in the terminal.

## Default Admin Account

The default administrator is configured through the backend environment variables.

```text
Email: admin@school.edu
Password: admin123
```

For production use, change the administrator credentials and JWT secret.

# Docker

The project includes a `Dockerfile` for building the complete application image.

The Docker image contains:

* Node.js backend
* React production build
* Nginx web server

Build the image manually:

```powershell
docker build -t event-registration:latest .
```

Run the container:

```powershell
docker run -d --name event-registration -p 4000:4000 -e PORT=3000 -e DB_HOST=host.docker.internal -e DB_USER=root -e DB_PASSWORD= -e DB_NAME=event_registration -e ADMIN_EMAIL=admin@school.edu -e ADMIN_PASSWORD=admin123 event-registration:latest
```

The application is then available at:

```text
http://localhost:4000
```

Nginx listens on port `4000` inside the container and serves the React frontend.

API requests beginning with `/api/` are forwarded by Nginx to the Express backend running on port `3000`.

# Jenkins CI/CD Pipeline

The project uses Jenkins to automatically build, test, package, and deploy the application whenever changes are detected in the GitHub repository.

GitHub repository:

```text
https://github.com/AisenKil/event-registration.git
```

The Jenkins pipeline is defined in:

```text
Jenkinsfile
```

## Pipeline Process

The current pipeline performs the following process:

```text
GitHub Repository
        ↓
Checkout
        ↓
Install Backend Dependencies
        ↓
Install Frontend Dependencies
        ↓
Prepare MySQL Database
        ↓
Run Backend Unit Tests
        ↓
Generate JUnit Report
        ↓
Build Frontend
        ↓
Build Docker Image
        ↓
Deploy Docker Container
        ↓
Application Available on Port 4000
```

## Jenkins Stages

### 1. Checkout

Jenkins retrieves the latest code from the `main` branch of the GitHub repository.

### 2. Install Backend

Jenkins enters the `backend` directory and runs:

```text
npm ci
```

This installs the exact dependencies defined by `package-lock.json`.

### 3. Install Frontend

Jenkins enters the `frontend` directory and runs:

```text
npm ci
```

This installs the frontend dependencies.

### 4. Prepare Database

Jenkins checks that the MySQL database exists.

The database name is:

```text
event_registration
```

The current Jenkins configuration uses the XAMPP MySQL executable:

```text
C:\xampp\mysql\bin\mysql.exe
```

### 5. Backend Unit Tests

Jenkins runs:

```text
npm test
```

The backend uses Node.js' built-in test runner.

The current three tests verify:

* `/api/health` returns a successful response.
* Protected API routes reject unauthenticated users.
* Unknown API routes return HTTP 404.

The test command also generates a JUnit XML report:

```text
backend/test-results.xml
```

The report is automatically published by Jenkins in the `post` section of the Jenkinsfile.

This allows Jenkins to record test results and maintain test history for future builds.

### 6. Frontend Build

Jenkins runs:

```text
npm run build
```

This checks the TypeScript code and creates the production frontend files in:

```text
frontend/dist
```

### 7. Build Docker Image

Jenkins builds the Docker image using:

```text
docker build -t event-registration:latest .
```

The resulting image is:

```text
event-registration:latest
```

### 8. Deploy

Before deploying, Jenkins removes the previous container:

```text
docker rm -f event-registration
```

Jenkins then starts a fresh container using:

```text
event-registration:latest
```

The container is mapped to port `4000`:

```text
-p 4000:4000
```

The deployed application can therefore be accessed at:

```text
http://localhost:4000
```

## Automatic Jenkins Builds

The Jenkinsfile contains the following SCM polling trigger:

```groovy
triggers {
    pollSCM('* * * * *')
}
```

This makes Jenkins check the GitHub repository every minute for new commits.

When a new commit is detected on the `main` branch, Jenkins automatically starts a new pipeline.

The pipeline then:

```text
Detect New Commit
        ↓
Checkout Latest Code
        ↓
Install Dependencies
        ↓
Run Tests
        ↓
Build Frontend
        ↓
Build Docker Image
        ↓
Remove Previous Container
        ↓
Deploy Fresh Container
```

## JUnit Test Reports

The backend `package.json` uses Node.js' built-in JUnit reporter:

```text
node --test --test-reporter=junit --test-reporter-destination=test-results.xml
```

The generated report is stored at:

```text
backend/test-results.xml
```

The file is excluded from Git using `.gitignore` because Jenkins generates it during every build.

The Jenkinsfile publishes the report using:

```groovy
post {
    always {
        junit testResults: 'backend/test-results.xml', allowEmptyResults: true
    }
}
```

This allows Jenkins to keep the results of the tests from each build and display test history over time.

## Jenkins Post Actions

The Jenkins `post` section performs actions after the pipeline finishes.

It publishes the JUnit report regardless of whether the pipeline succeeds or fails:

```groovy
post {
    always {
        junit testResults: 'backend/test-results.xml', allowEmptyResults: true
        echo 'JUnit test report published.'
        echo 'Pipeline finished.'
    }

    success {
        echo 'Pipeline completed successfully.'
    }

    failure {
        echo 'Pipeline failed. Check the stage logs above.'
    }
}
```

## Jenkins Build Result

A successful pipeline ends with:

```text
Finished: SUCCESS
```

A failed stage causes the Jenkins build to fail. The Jenkins Console Output can be used to identify the failed stage.

## Nginx

The Docker container uses Nginx to serve the production React frontend.

Nginx listens on:

```text
4000
```

Requests to:

```text
/api/
```

are proxied to the Express backend:

```text
127.0.0.1:3000
```

All other requests are handled by the React production files.

The current Nginx configuration is therefore being used as a reverse proxy and frontend web server. It is not currently configured as a multi-backend load balancer.

## Application Rules

The system implements the following rules:

* One registration per user per event.
* Registrations exceeding the maximum participant limit are automatically rejected.
* Users receive notifications when their registration is approved or rejected.
* Administrators receive notifications when an event reaches its maximum participant capacity.

## Development Workflow

The recommended development workflow is:

```text
Make Code Changes
        ↓
Test Locally
        ↓
git add
        ↓
git commit
        ↓
git push origin main
        ↓
Jenkins Detects New Commit
        ↓
Jenkins Runs Pipeline
        ↓
Unit Tests
        ↓
JUnit Report
        ↓
Frontend Build
        ↓
Docker Image Build
        ↓
Fresh Container Deployment
        ↓
SUCCESS / FAILURE
```

## Current Jenkins Verification

The Jenkins CI/CD pipeline has been successfully tested.

The verified stages are:

```text
✓ GitHub Checkout
✓ Backend npm ci
✓ Frontend npm ci
✓ MySQL Database Preparation
✓ Backend Unit Tests
✓ JUnit Test Report Generation
✓ JUnit Report Publishing
✓ Frontend Production Build
✓ Docker Image Build
✓ Docker Container Deployment
✓ Application Deployment on Port 4000
✓ Jenkins Post Actions
```

The successful Jenkins build ends with:

```text
Finished: SUCCESS
```

## Current Project Status

The main CI/CD requirements currently implemented are:

```text
✓ Node.js application
✓ 3 backend unit tests
✓ Dockerfile
✓ Jenkinsfile
✓ Dependency installation
✓ Unit testing
✓ JUnit reporting
✓ Frontend build
✓ Docker image build
✓ Docker deployment
✓ Automatic SCM polling
✓ Fresh container deployment on port 4000
```

The Selenium frontend UI test has not yet been added and remains a separate task.

# Assignment Deliverables

The project addresses the required CI/CD deliverables as follows:

### 1. Node.js Application

The existing School Event Registration system uses Node.js and Express for its backend.

### 2. Three Unit Tests

Three backend unit tests are implemented using Node.js' built-in test runner.

### 3. Selenium UI Test

A Selenium frontend UI test is planned but has not yet been implemented.

### 4. Dockerfile

A Dockerfile is included to package the backend and production frontend with Nginx.

### 5. Jenkinsfile

The Jenkinsfile combines:

```text
Install
Unit Test
Frontend Build
Docker Build
Deploy
```

### 6. Automatic Deployment

Jenkins uses:

```groovy
pollSCM('* * * * *')
```

to check the GitHub repository every minute.

When a new commit is detected, Jenkins builds and deploys a fresh Docker container on:

```text
Port 4000
```

### 7. JUnit Reports

The Jenkins `post` section publishes:

```text
backend/test-results.xml
```

so Jenkins can maintain test results and test history across builds.
