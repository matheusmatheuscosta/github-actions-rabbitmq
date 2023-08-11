#!/usr/bin/env node
const core = require('@actions/core');
const amqp = require('amqplib/callback_api');
console.log("amqp created.");
try {
  const RABBITMQ_HOST = core.getInput("RABBITMQ_HOST");
  const RABBITMQ_PORT = core.getInput("RABBITMQ_PORT");
  const RABBITMQ_USERNAME = core.getInput("RABBITMQ_USERNAME");
  const RABBITMQ_PASSWORD = core.getInput("RABBITMQ_PASSWORD");

  const OBJECT = core.getInput("OBJECT");
  const QUEUENAME = core.getInput("QUEUENAME");

  var url = 'amqp://' + RABBITMQ_USERNAME + ':' + RABBITMQ_PASSWORD + '@' + RABBITMQ_HOST + ':' + RABBITMQ_PORT;
  console.log("Url: " + url);
  amqp.connect(url, function (error0, connection) {
    if (error0) {
      console.log("error0: " + error0);
      throw error0;
    }
    connection.createChannel(function (error1, channel) {
      console.log("creating channel");
      if (error1) {
        console.log("error1: " + error1);
        throw error1;
      }

      channel.assertQueue(QUEUENAME, {
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: null
      });
      console.log("asserting channel");

      var MESSAGE = JSON.stringify(OBJECT);
      channel.publish('', QUEUENAME, Buffer.from(MESSAGE));
      console.log("message sent");
      console.log(" [x] Sent %s", MESSAGE);
    });
    setTimeout(function () {
      connection.close();
      process.exit(0);
    }, 500);
  });
} catch (error) {
  core.setFailed(error.message);
}