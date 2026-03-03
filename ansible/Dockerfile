FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssh-client curl jq git && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir ansible-core==2.17.*
WORKDIR /ansible
ENTRYPOINT ["ansible-playbook"]
