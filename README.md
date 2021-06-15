# k8s

This project contains a sample application(frontend + service) which can be deployed using K8S. It contains a basic ReactJS application for frontend while a NodeJS app for the service layer. Both apps are decoupled according to the [Jamstack](https://jamstack.org/) architecture.

## Pre-requisites

1. Docker Daemon
2. Minikube (a single node K8S cluster for local development)
3. kubectl

## NodeJS App

The NodeJS(Express) app was generated following [this](https://expressjs.com/en/starter/hello-world.html) documentation.

It exposes a simple POST API (`/api/log`) which logs a simple statement to the console and returns a dummy response.

The port on which the app is exposed is currently hardcoded as 8080. Check `nodejs-app/index.js`.

## React App

The React app was generated using [Create React App](https://create-react-app.dev/docs/getting-started).

The app upon load makes a POST request to the endpoint exposed by Node app. Check `react-app/src/App.js`. This is to demonstrate a connection between the frontend and service layer deployed using Jamstack architecture. The final built app is deployed on Nginx.

## Docker Images

### NodeJS

Build and push the Node app docker image to Docker Hub. Execute below in `nodejs-app` directory.

```bash
# docker build . -t <image-name>
docker build . -t docker-nodejs-app

# docker tag <image-name> <dockerhub-username>/<tag-name>
docker tag docker-nodejs-app yashkapila/docker-nodejs-app

# docker push <dockerhub-username>/<tag-name>
docker push yashkapila/docker-nodejs-app
```

### ReactJS

Build and push the React app docker image to Docker Hub. Execute below in `react-app` directory.

```bash
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
    # nodejs-backend-service is the internal DNS name used by the backend Service inside Kubernetes
    server nodejs-backend-service;
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
    # nodejs-backend-service is the internal DNS name used by the backend Service inside Kubernetes
    server nodejs-backend-service;
}
```

```
location /api {
    # The following statement will proxy traffic to the upstream named Backend
    proxy_pass http://Backend;
}
```

This means that whenever Nginx receives a request from the React app with `/api`, it should forward it to the NodeJS app that we have built i.e `http://Backend`. This is configured as an upstream whose DNS is configured in our K8S setup. More on that down below.

## K8S Setup

We have 4 k8s configuration objects defined in:

- backend.deployment.yaml
- backend.service.yaml
- frontend.deployment.yaml
- frontend.service.yaml

`*.deployment.yaml` configurations are responsible for creating Replica Sets and Pods for our Node and React App.

`backend.service.yaml` configuration is responsible to create a service which exposes NodeJS app pods to be able to accessed within the cluster(not outside the cluster though - that would be the responsibility of our frontend Load Balancer). This is defined as `nodejs-backend-service`. Note that this is the exact same name that we have configured in our Nginx upstream above. This is what connects our Nginx to the Node app.

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

If you wish to test out the above setup on a local minikube cluster, execute below once above commands were successful. This would open up the React app locally. Open the browser Network tab and look for a successful `/api/log` request.

```bash
minikube service react-frontend-service
```