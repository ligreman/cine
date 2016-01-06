#!/usr/bin/env bash

node src/main/scripts/initMongo.js
node src/main/scripts/getMoviesVanGogh.js
node src/main/scripts/getMoviesOdeon.js
node src/main/scripts/resetUpdateTime.js
