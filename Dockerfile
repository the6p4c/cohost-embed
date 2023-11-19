###############
# development #
###############
FROM node:21 as development
USER node
WORKDIR /home/node/

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

#########
# build #
#########
FROM development as build

COPY --chown=node package.json package-lock.json build/
RUN cd build/ && npm ci
COPY --chown=node . build/

RUN cd build/ && npm run app:build
RUN cd build/ && npm run worker:build

##############
# production #
##############
FROM development as production
USER node
WORKDIR /home/node/
ENV NODE_ENV production

COPY --from=build --chown=node /home/node/build/.next/standalone/ app/
COPY --from=build --chown=node /home/node/build/.next/static/ app/.next/static/

COPY --from=build --chown=node /home/node/build/dist/worker/ worker/
