#!/bin/bash
# Runs once, the first time the MySQL volume is created.
#
# Prisma's `migrate dev` needs a "shadow" database. The app user only has access
# to its own database, so we create one up front and grant access to it.
set -e

mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<-EOSQL
  CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}_shadow\`;
  GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}_shadow\`.* TO '${MYSQL_USER}'@'%';
  FLUSH PRIVILEGES;
EOSQL
