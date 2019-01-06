'use strict';

const express = require('express');
const solve = require('./solve');

const app = express();
const port = 1234;

app.get('/', (req, res) => res.redirect('/static-variables'))
    .get('/static-variables', (req, res) => solve(req, res))
    .listen(port);

console.log(`Server runs on port ${port}`);