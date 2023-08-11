#!/usr/bin/env node
const axios = require('axios');
const core = require('@actions/core');
const amqp = require('amqplib/callback_api');
console.log("amqp created.");
try {
  const PASSWORD_VAULT_URL = core.getInput("PASSWORD_VAULT_URL");
  let RABBITMQ_HOST = core.getInput("RABBITMQ_HOST");
  let RABBITMQ_PORT = core.getInput("RABBITMQ_PORT");
  let RABBITMQ_USER = core.getInput("RABBITMQ_USER");
  let RABBITMQ_PASS = core.getInput("RABBITMQ_PASS");
  let OBJECT = core.getInput("OBJECT");
  let QUEUE = core.getInput("QUEUE");

  console.log("PASSWORD_VAULT_URL: " + PASSWORD_VAULT_URL);
  console.log("RABBITMQ_HOST: " + RABBITMQ_HOST);
  console.log("RABBITMQ_PORT: " + RABBITMQ_PORT);
  console.log("RABBITMQ_USER: " + RABBITMQ_USER);
  console.log("RABBITMQ_PASS: " + RABBITMQ_PASS);
  console.log("OBJECT: " + OBJECT);
  console.log("QUEUE: " + QUEUE);

  if (PASSWORD_VAULT_URL) {
    const url = PASSWORD_VAULT_URL + '/secrets/replace';
    const data = {
      RABBITMQ_HOST: RABBITMQ_HOST,
      RABBITMQ_PORT: RABBITMQ_PORT,
      RABBITMQ_USER: RABBITMQ_USER,
      RABBITMQ_PASS: RABBITMQ_PASS,
      OBJECT: OBJECT,
      QUEUE: QUEUE
    }
    let retorno = null;
    axios.post(url, data).then(function (response) {
      console.log("retorno: " + retorno);
      retorno = response.data;
      RABBITMQ_HOST = retorno.RABBITMQ_HOST;
      RABBITMQ_PORT = retorno.RABBITMQ_PORT;
      RABBITMQ_USER = retorno.RABBITMQ_USER;
      RABBITMQ_PASS = retorno.RABBITMQ_PASS;
      OBJECT = retorno.OBJECT;
      QUEUE = retorno.QUEUE;
      publishToQueue(RABBITMQ_USER, RABBITMQ_PASS, RABBITMQ_HOST, RABBITMQ_PORT, QUEUE, OBJECT);
    }).catch(function (error) {
      console.log(error);
    });
  } else {
    console.log("PASSWORD_VAULT_URL is empty");
    publishToQueue(RABBITMQ_USER, RABBITMQ_PASS, RABBITMQ_HOST, RABBITMQ_PORT, QUEUE, OBJECT);
  }
} catch (error) {
  core.setFailed(error.message);
}

// cria função para publicar na fila
function publishToQueue(RABBITMQ_USER, RABBITMQ_PASS, RABBITMQ_HOST, RABBITMQ_PORT, QUEUE, OBJECT) {
  var url = 'amqp://' + RABBITMQ_USER + ':' + RABBITMQ_PASS + '@' + RABBITMQ_HOST + ':' + RABBITMQ_PORT;
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

      channel.assertQueue(QUEUE, {
        durable: true,
        exclusive: false,
        autoDelete: false,
        arguments: null
      });
      console.log("asserting channel");

      var MESSAGE = JSON.stringify(OBJECT);
      channel.publish('', QUEUE, Buffer.from(MESSAGE));
      console.log("message sent");
      console.log(" [x] Sent %s", MESSAGE);
    });
    setTimeout(function () {
      connection.close();
      process.exit(0);
    }, 500);
  });
}