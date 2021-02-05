#!/bin/bash
set -e
# set -x

APP_NAME="fsm-scheduling-samples"
GIT_REV="$(git rev-parse --short=9 HEAD)";
TIMESTAMP=$(awk 'BEGIN {srand(); print srand()}');
APP_VERSION="$GIT_REV-$TIMESTAMP";
DOCKER_HUB_ACC="gausim";
IMAGE_FULL="$DOCKER_HUB_ACC/$APP_NAME:$APP_VERSION";
IMAGE_LATEST="$DOCKER_HUB_ACC/$APP_NAME:latest";

function promptyn() {
  while true; do
    echo ""
    read -p "$1 " yn
    case $yn in
    [Yy]*) return 0 ;;
    [Nn]*) return 1 ;;
    *) echo "Please answer yes or no." ;;
    esac
  done
}

run_container () {
  run_cmd="docker run --rm -e PORT=3000 -p 3000:3000 --name $APP_NAME $IMAGE_LATEST";
  $run_cmd
}


build_container() {

  if promptyn "[ACTION] clean node_modules for 'clean' install? (y/n) "; then 
     echo "NPM-CLEAN-UP==================================";
     # ensure clean node_modules in container
     rm -rf ./frontend/node_modules
     rm -rf ./backend-api/node_modules
     echo "DONE=============================================";
  else 
     echo ""
  fi


  if promptyn "[ACTION] delete cached doccker images for $APP_NAME for 'clean' build? (y/n) "; then 
     echo "DOCKER-CLEAN-UP==================================";
     
     ((docker images -a | grep $APP_NAME | awk '{print $3}' | xargs docker rmi -f) || :) && echo done;

     echo "DONE=============================================";
  else 
     echo ""
  fi

  echo "DOCKER-BUILD=====================================";
  docker build . -t $IMAGE_FULL -t "$IMAGE_LATEST" --build-arg APP_VERSION="$GIT_REV-$TIMESTAMP";
  echo "DONE=============================================";

  echo "DONE=============================================";
  run_cmd="docker run --rm -e PORT=3000 -p 3000:3000 --name $APP_NAME $IMAGE_FULL";
  echo $run_cmd;
  echo "=================================================";

  if promptyn "[ACTION] run the container (y/n) "; then 

      $run_cmd

    else 
      echo ""
    fi

}

deploy (){
  # How to deploy:
  # https://blogs.sap.com/2020/07/07/deploy-application-using-docker-container-on-sap-cloud-foundry-2020/
  # Login to https://account.hana.ondemand.com/#/home/welcome
  CF_CLI=cf
  CF_APP_ANME=$APP_NAME
  CF_API="https://api.cf.eu10.hana.ondemand.com"

  if ! command -v $CF_CLI &> /dev/null
  then
    if promptyn "[ACTION] missing cf (cloud foundry cli), wanne download & install now? (y/n) "; then 
      TEMP_DIR=".temp";
      echo "=================================================";
      echo "installing...";
      
      (rm -rf $TEMP_DIR || :)
      mkdir -p $TEMP_DIR && cd $TEMP_DIR;
      
      # MAC OS download :) 
      # find more here https://github.com/cloudfoundry/cli/wiki/V7-CLI-Installation-Guide
      curl -L "https://packages.cloudfoundry.org/stable?release=macosx64-binary&version=v7&source=github" | tar -zx
      cd ..
      
      CF_CLI="./$TEMP_DIR/cf"
      echo 
    else 
      exit 0
    fi
  fi

  echo "=================================================";
  # Login and deploy
  # Login will ask for code... to pass code use
  # $CF_CLI login -a $CF_API --sso-passcode $PASSCODE 
  $CF_CLI login -a $CF_API --sso
  $CF_CLI push $CF_APP_ANME --docker-image $IMAGE_LATEST
  $CF_CLI app $CF_APP_ANME

  # (rm -rf $TEMP_DIR || :)
  exit 1;
}


pring_usage () {
  echo "[HELP]:";
  echo "";
  echo "b -> build container";
  echo "r -> run latest container";
  echo "p -> push latest container";
  echo "d -> deploy";
  #TODO echo "bd -> build & deploy <env>";
  echo "";
  echo "CRL+C -> to quit"
}

# CLI
while true; do
  pring_usage
  read -p ">>> " action
  case $action in
      b)
          build_container;
          ;;
      p)
          docker push $IMAGE_LATEST
          ;;
      r)
          run_container;
          ;;
      d)
          deploy;
          ;;
      bd)
          read -p "environment: <test|stage|prod> ? " env
          build_container;
          deploy $env;
          ;;
     *)
          ;;
  esac
done
