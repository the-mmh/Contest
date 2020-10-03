FROM node:10
WORKDIR .

RUN sudo apt-get update
RUN sudo apt-get install build-essential
RUN g++ -v
COPY package.json .
RUN npm install --production
COPY . .

ENV MONGO_URI = mongodb+srv://piyushg9794:passwordnahi@123@contest.j9ls1.mongodb.net/logsn
ENV AZURE_ACCOUNT = contestiiitp
ENV AZURE_ACCOUNT_KEY = Lxj7+F1JeursnOcs/223ujVDzn9aQ3e3B6tYXmEwEq1aQbdG1ATtoWijQdp1gVvJHBQ0PiB/RTiRB42e4shKKw==
ENV CLOUDAMQP_URL = amqps://giarifma:r6gcUKQqsoPWzs7Ps7IplT_d0OuUhSO3@lionfish.rmq.cloudamqp.com/giarifma

CMD ["node", "src/server.js"]
