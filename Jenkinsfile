pipeline {
    agent any

    triggers {
        pollSCM('* * * * *')
    }

    environment {
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
        DB_NAME = 'event_registration'
        MYSQL = 'C:\\xampp\\mysql\\bin\\mysql.exe'
        DOCKER_IMAGE = 'event-registration:latest'
        DOCKER_CONTAINER = 'event-registration'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend') {
            steps {
                dir("${BACKEND_DIR}") {
                    bat 'npm ci'
                }
            }
        }

        stage('Install Frontend') {
            steps {
                dir("${FRONTEND_DIR}") {
                    bat 'npm ci'
                }
            }
        }

        stage('Prepare Database') {
            steps {
                bat '"%MYSQL%" -u root -e "CREATE DATABASE IF NOT EXISTS %DB_NAME%;"'
            }
        }

        stage('Backend Test') {
            steps {
                dir("${BACKEND_DIR}") {
                    bat 'npm test'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir("${FRONTEND_DIR}") {
                    bat 'npm run build'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t %DOCKER_IMAGE% .'
            }
        }

        stage('Deploy') {
            steps {
                bat 'docker rm -f %DOCKER_CONTAINER% 2>nul || exit /b 0'
                bat 'docker run -d --name %DOCKER_CONTAINER% -p 4000:4000 -e PORT=3000 -e DB_HOST=host.docker.internal -e DB_USER=root -e DB_PASSWORD= -e DB_NAME=%DB_NAME% -e ADMIN_EMAIL=admin@school.edu -e ADMIN_PASSWORD=admin123 %DOCKER_IMAGE%'
            }
        }
    }

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
}
