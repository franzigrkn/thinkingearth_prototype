FROM nvcr.io/nvidia/dgl:24.09-py3 

COPY requirements.txt /tmp/requirements.txt
RUN python -m pip install --no-cache-dir --upgrade pip
RUN python -m pip install --no-cache-dir --upgrade setuptools
RUN python -m pip install --no-cache-dir --upgrade wheel

RUN --mount=type=secret,id=netrc,target=/root/.netrc,required=true \
    python -m pip install --no-cache-dir \
        --requirement /tmp/requirements.txt \
        # DVL group package index
        --extra-index-url https://gitlab-master.nvidia.com/api/v4/groups/106305/-/packages/pypi/simple \
        # NCoreSDK package index
        --extra-index-url https://gitlab-master.nvidia.com/api/v4/projects/61004/packages/pypi/simple \
        #--find-links https://download.pytorch.org/whl/torch \
        #--find-links https://download.pytorch.org/whl/torchvision \
    && rm /tmp/requirements.txt
     
ENV DEBIAN_FRONTEND=
WORKDIR /thinkingearth_prototype