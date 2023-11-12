###############
# development #
###############
FROM node:21 as development
USER node
WORKDIR /home/node/

#########
# build #
#########
FROM development as build
ENV NODE_ENV production

COPY --chown=node packages/common/ common/
RUN cd common/ && npm ci

COPY --chown=node packages/web/ web/
RUN cd web/ && npm ci

RUN cd web/ && npm run build

##############
# production #
##############
FROM node:21 as production
USER node
WORKDIR /home/node/

COPY --from=build /home/node/web/.next/standalone web/

CMD cd web/ && node server.js
