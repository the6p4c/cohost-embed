##############
# playwright #
##############
FROM node:21 as playwright

# install playwright chromium and its required system dependencies. dependencies are installed first
# as they're the least likely to change.
#
# note: if the dependencies aren't installed, you get an ENOENT when playwright tries to launch
# chromium. this ends up confusing you, because the actual chromium binary is *right there*. but
# really, it's an ENOENT for a shared lib it can't find.
USER root
RUN npx playwright install-deps chromium
USER node
RUN npx playwright install chromium

#######
# dev #
#######
FROM playwright AS dev
WORKDIR /home/node/dev/

#########
# build #
#########
FROM dev as build
WORKDIR /home/node/build/

# copy only the package manifest and lock file, which always change when dependencies change but
# only occasionally change otherwise. these layers are thus essentially cached based only on the
# dependency tree.
COPY --chown=node package.json package-lock.json ./
RUN npm ci
# now, copy the full source code
COPY --chown=node . ./

RUN npm run app:build
RUN npm run worker:build

############
# prod-app #
############
FROM playwright as prod-app
ENV NODE_ENV production
WORKDIR /home/node/app/

COPY --from=build --chown=node /home/node/build/.next/standalone/ ./
COPY --from=build --chown=node /home/node/build/.next/static/ ./.next/static/

###############
# prod-worker #
###############
FROM playwright as prod-worker
ENV NODE_ENV production
WORKDIR /home/node/worker/

COPY --from=build --chown=node /home/node/build/dist/worker/ ./
