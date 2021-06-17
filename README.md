# k8s

Firstly, I would like to thank you for taking some time out and reviewing this assignment with me.

This project contains a sample application(frontend + service) which can be deployed using K8S. It contains a basic ReactJS application for frontend while a PHP app for the service layer. Both apps are decoupled according to the modern [Jamstack](https://jamstack.org/) architecture.

## Pre-requisites

1. Docker Daemon
2. Minikube (a single node K8S cluster for local development)
3. kubectl

## Applications

### PHP

The PHP(Slim) app was generated using composer.

```bash
composer create-project slim/slim-skeleton php-app
```

Inside `app/routes.php`, it exposes a simple POST API (`/api/log`) which returns a dummy response.

Port on which the app is exposed is currently hardcoded as 8080.

### React

The React app was generated using [Create React App](https://create-react-app.dev/docs/getting-started).

The app upon load makes a POST request to the endpoint exposed by PHP app. Check `react-app/src/App.js`.

This is done to demonstrate a connection between the frontend and service layer deployed using Jamstack architecture. The final built version of the app is deployed on Nginx.

## Dockerizing apps

Basic Dockerfiles for both React and PHP apps are located inside their respective apps.

### PHP

Build and push the PHP app docker image to Docker Hub. Execute below in `php-app` directory.

```bash
# docker build . -t <image-name>
docker build . -t docker-php-app

# docker tag <image-name> <dockerhub-username>/<tag-name>
docker tag docker-php-app yashkapila/docker-php-app

# docker push <dockerhub-username>/<tag-name>
docker push yashkapila/docker-php-app
```

### ReactJS

Build and push the React app docker image to Docker Hub. Execute below in `react-app` directory.

```bash
# npm i
npm i

# Build app
npm run build

# docker build . -t <image-name>
docker build . -t docker-react-app

# docker tag <image-name> <dockerhub-username>/<tag-name>
docker tag docker-react-app yashkapila/docker-react-app

# docker push <dockerhub-username>/<tag-name>
docker push yashkapila/docker-react-app
```

#### nginx.conf

We copy a custom Nginx configuration to the docker image instead of using default configuration. Find the custom config at `react-app/nginx.conf`.

```
# The identifier Backend is internal to nginx, and used to name this specific upstream
upstream Backend {
    # php-backend-service is the internal DNS name used by the backend Service inside Kubernetes
    server php-backend-service;
}

server {
    listen 80;

    location / {
        #The location setting lets you configure how nginx responds to requests for resources within the server.
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }

    location /api {
        # The following statement will proxy traffic to the upstream named Backend
        proxy_pass http://Backend;
    }
}
```

Key parts in above configuration are:

```
upstream Backend {
    # php-backend-service is the internal DNS name used by the backend Service inside Kubernetes
    server php-backend-service;
}
```

```
location /api {
    # The following statement will proxy traffic to the upstream named Backend
    proxy_pass http://Backend;
}
```

It means that when Nginx receives a request from the React app with `/api`, it should forward it to the PHP app i.e `http://Backend`. This is configured as an upstream whose DNS is configured in our K8S setup. More on that down below.

## K8S Setup

We have 4 k8s configuration objects defined in:

- backend.deployment.yaml
- backend.service.yaml
- frontend.deployment.yaml
- frontend.service.yaml

`backend.deployment.yaml` object is responsible for creating Pods for the PHP app.

`frontend.deployment.yaml` object is responsible for creating Pods for the React app.

`backend.service.yaml` configuration is responsible to create a service which enables PHP app to be accessible within the cluster. Being a ClusterIP kind, it is only accessible within the cluster but not outside it. It is named as **php-backend-service**. **Note** this is the exact same name that we have configured in our Nginx upstream above. This is what connects Nginx to the PHP app.

`frontend.service.yaml` configuration is responsible to create a Load Balancer which allows us to access our React app outside the K8S cluster.

Once the docker images are successfully created in previous step, execute below inside `resource-manifests` to setup the deployments and services for our FE and BE apps.

```bash
# Create backend deployment
kubectl apply -f backend.deployment.yaml

# Create backend ClusterIP service
kubectl apply -f backend.service.yaml

# Create frontend deployment
kubectl apply -f frontend.deployment.yaml

# Create frontend Load Balancer service
kubectl apply -f frontend.service.yaml
```

### Testing

#### Minikube

To test out the above setup on a local minikube cluster create above defined k8s objects and execute below.

We need to expose this service through Minikube because in a local development setup, there is no External IP address provided to reach out to the React application. Hence, a port forwarding is done by minikube to achieve desired behaviour.

```bash
# Start a minikube cluster if not done already
minikube start

# Let minikube expose React service on localhost
minikube service react-frontend-service
```

This opens the React app locally on a port automatically assigned by Minikube. Open the browser Network tab and look for a successful `/api/log` request.

#### Google Cloud Provider

The same setup above can also be tested on a cloud provider. For the sake of this exercise we are going to use GKE service.

In order to test this out successfully, create a basic K8S cluster using GKE and set it as the current context for `kubectl`.

Once successful, create all objects defined above. When Load Balancer service is up, GCP would provide an external IP address which can be reached through the internet.

## Scope of improvement

There are a few areas I feel I could have done better but didn't manage to finish in the time available. Some of those points are:

1. Use Ingress object instead of the services defined for frontend and backend.
2. Currently, the backend service name is configured inside Nginx which causes a mix of my infrastructure with application and could be separated. I am thinking an environment variable might have been better.
