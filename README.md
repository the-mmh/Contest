# Contester for university students

## Why?
Considering the challenges faced by technical club coordinators of universities in hosting a coding contest in platforms like codechef & hackerrank we developed a flexible & ready to use contester system. The purpose is to facilitate easy organising of coding contest to train university students without going through a time-taking process.

## Features:
1. Discussion Portal
2. Competitive programming contests
3. Leaderboard (Rating System)
4. Ranklist for each contest
5. Admin portal to create contest & add questions

## Techstack used:
1. Backend is developed using node.js and consist of 3 different microservices (discussion, contest & evaluator).
2. RabbitMQ is used for communicating between microservices.
3. Azure file storage & mongodb are used for data storage.
4. Microservices are dockerized & were initially deployed on azure containers, but due to restrictions of student subscription we moved it to heroku.
5. Handlebars is used for frontend development.

## Server capabilities:
1. Concurrency & multithreading support to handle large ammount of simultaenous submissions.
2. Horizontal scalibility support.
3. Support for time limit & memory limit on each submission.
4. Student can only signup with institute provided email id, hence none can have multiple accounts.
