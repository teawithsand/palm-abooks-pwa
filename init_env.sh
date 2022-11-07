#!/bin/bash
# Do not use yarn here, it for some reason does not add installed scripts to $PATH
cd $(realpath $(dirname "$0"))
npm i -g gatsby
gatsby telemetry --disable
# echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

# Test dependency list used in projects:
# jest @types/jest ts-jest jest-environment-jsdom fake-indexeddb @trust/webcrypto web-streams-polyfill @testing-library/jest-dom