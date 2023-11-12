###############
# development #
###############
FROM node:21 as development
USER node
WORKDIR /home/node/

# install playwright chromium and its required system dependencies (deps first as they're the least
# likely to change)
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
ENV NODE_ENV production

COPY --chown=node packages/common/ common/
RUN cd common/ && npm ci

COPY --chown=node packages/worker/ worker/
RUN cd worker/ && npm ci

##############
# production #
##############
FROM build as production

CMD cd worker/ && npm run start
