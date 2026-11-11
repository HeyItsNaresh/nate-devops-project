# IT Security Management & DevOps – Final Project

**Student:** Naresh Kailash Punjabi  
**Student ID:** 10008299

## Project Overview

This project demonstrates how to containerize and deploy a Ruby on Rails CRUD application using Docker and Kubernetes.

The application is connected to a MariaDB database and allows users to create, read, update, and delete items.

The project also includes load testing using k6 and a demonstration of Kubernetes automatically recovering an unhealthy application container.

## Technologies Used

- Ruby 3.4.12
- Ruby on Rails 8.1.4.1
- MariaDB 11.4
- Docker and Docker Compose
- Kubernetes (Minikube)
- k6 for load testing

## Application

The application uses a model called `NateItem`, containing two main fields:

- `name` – Name of the item
- `description` – Description of the item

The following API endpoints are available:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/items` | Display all items |
| GET | `/items/:id` | Display one item |
| POST | `/items` | Create an item |
| PUT | `/items/:id` | Update an item |
| DELETE | `/items/:id` | Delete an item |
| GET | `/up` | Application health check |

## Running with Docker Compose

The application uses a multi-stage Dockerfile and Docker Compose to run Rails and MariaDB in separate containers.

Before starting, create a `.env` file in the project directory containing:

```env
DB_PASSWORD=your_database_password
DB_ROOT_PASSWORD=your_root_password
SECRET_KEY_BASE=your_rails_secret
```

Build the Rails Docker image:

```bash
docker build -t nate-rails-app:latest .
```

Start the containers:

```bash
docker compose up -d
```

Check their status:

```bash
docker compose ps
```

The Rails application is accessible at:

`http://localhost:3000/items`

## Kubernetes Deployment

Minikube was used to deploy the Rails application and MariaDB.

The Kubernetes configuration files are located in the `k8s` directory:

- `deployment.yaml` – Rails application Deployment
- `service.yaml` – Rails application Service
- `mariadb.yaml` – MariaDB Deployment, Service, and persistent storage

The Rails Deployment uses one replica with CPU and memory limits. Readiness and liveness probes check the `/up` endpoint.

MariaDB uses a PersistentVolumeClaim to store database data.

Database passwords are provided through a Kubernetes Secret named `nate-db-secret`.

After starting Minikube, load the Rails Docker image into the cluster:

```bash
minikube image load nate-rails-app:latest
```

Create the database Secret using the password values configured for the project, then apply the Kubernetes manifests:

```bash
kubectl apply -f k8s/mariadb.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

Run the database migration:

```bash
kubectl exec deployment/nate-rails-deployment -- bin/rails db:migrate
```

Check the running pods:

```bash
kubectl get pods
```

To access Rails locally:

```bash
kubectl port-forward service/nate-rails-service 3001:3000
```

The application can then be accessed at:

`http://localhost:3001/items`

## Load Testing

Load testing was performed using k6 and the script provided during the course.

The test gradually increased the number of virtual users to 500, maintained the peak load, and then reduced the number of users.

The configured test duration was 60 seconds.

The script tests the application's CRUD endpoints and measures response times, throughput, and request failures.

The original test script is located at:

`load-tests/load-test.js`

The recorded results are stored in:

`load-tests/results/`

The application experienced high response times and failed requests during the test. The results may have been influenced by application resource limits and the port-forward connection used during testing.

## Fault Tolerance

During load testing, Kubernetes detected that the Rails application was not responding to its liveness probes.

Kubernetes automatically restarted the Rails container.

The restart count increased from 0 to 1, and the application returned to a healthy state.

Evidence of this behavior, including the pod description, previous container logs, and recovery status, is stored in:

`fault-tolerance/`

## Conclusion

This project demonstrates the use of Docker for containerization, Kubernetes for application deployment and recovery, and k6 for performance testing.

The application was successfully deployed using both Docker Compose and Kubernetes. All CRUD operations were verified.

Load testing also demonstrated the performance limitations of a single Rails replica under heavy traffic and the role of Kubernetes health probes in automatic recovery.