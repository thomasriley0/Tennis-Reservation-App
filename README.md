# Tennis-Reservation-App
App Description: 
Application that allows users to create profiles and view local tennis courts with their respective available times. They will be able to book certain time slots to use and play, as well as have the ability to find fellow players in the area with similar skill levels or time availability to connect and play with. 

## Contributors:  
 - [Tom Riley](https://github.com/thomasriley0)
 - [Mitch Kubina](https://github.com/MitchKubina)
 - [Jake Carroll](https://github.com/jaca8185)
 - [Rodrigo Moleiro](https://github.com/moliche)
 - [Caleb Lehman](https://github.com/CalebLehman16)
 - [Trish Le](https://github.com/trle5720)

## Tech Stack:
 - NodeJS
 - EJS View Engine
 - PostgreSQL
 - Bootstrap

## Prerequisites
 - [Docker](https://www.docker.com/products/docker-desktop/)
 - [NodeJS](https://nodejs.org/en/)
## How to run application locally
To run the application locally, clone the repository and navigate to the src folder:
``` 
cd "Project Code"/src
```
One there, it is possible to start the application through docker by typing the command:
```
docker compose up
```
Once starting the application, the app will be live at `http://localhost:3000` 
### Restarting Application
If starting the application a second time, it is required to first enter the command
```
docker compose down -v
```
in order to clear the volumes of the database, which will allow all of the test cases to pass.
## How To Run Test
The running of the test cases are fully handled in the `docker compose up` command. 
If the application is successfully running, then all of the test cases have passed.
## Deployed Application
The Deployed Application can be found at [http://recitation-12-team-03.eastus.cloudapp.azure.com:3000/]([http://recitation-12-team-03.eastus.cloudapp.azure.com:3000/](https://tennis-reservation-app.onrender.com/))

