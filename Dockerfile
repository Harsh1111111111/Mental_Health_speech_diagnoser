FROM ubuntu:20.04 AS report_server

WORKDIR /app/report_server

RUN apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
  build-essential \
  wget \
  software-properties-common \
  && rm -rf /var/lib/apt/lists/*

# Add the deadsnakes PPA and install the latest Python
RUN add-apt-repository ppa:deadsnakes/ppa && \
  apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y python3.10 python3-pip && \
  rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y libsndfile-dev libcairo2 libpango-1.0-0 libpangocairo-1.0-0

RUN apt-get install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

COPY . .

RUN pip3 install -r requirements.txt

RUN apt-get install -y ffmpeg

# nvm requirements
RUN apt-get update
RUN echo "y" | apt-get install curl
# nvm env vars
RUN mkdir -p /usr/local/nvm
ENV NVM_DIR /usr/local/nvm
# IMPORTANT: set the exact version
ENV NODE_VERSION v18.18.2
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use --delete-prefix $NODE_VERSION"
# add node and npm to the PATH
ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/bin
ENV PATH $NODE_PATH:$PATH

RUN npm install

CMD ["node", "index.js"]