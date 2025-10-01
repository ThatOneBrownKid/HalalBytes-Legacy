#!/bin/bash

# Define variables
APP_ROOT="/var/app/current"
APP_USER="webapp"

# 1. Create all necessary subdirectories (mkdir -p succeeds even if they exist)
mkdir -p $APP_ROOT/tmp/pids
mkdir -p $APP_ROOT/tmp/cache
mkdir -p $APP_ROOT/tmp/sockets
mkdir -p $APP_ROOT/log

# 2. Set ownership for the application user
chown -R $APP_USER:$APP_USER $APP_ROOT/tmp
chown -R $APP_USER:$APP_USER $APP_ROOT/log