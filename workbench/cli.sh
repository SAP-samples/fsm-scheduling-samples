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

  exit 1;

  case $1 in
      test)
            echo "TODO";
            exit 1;
            ;;
      stage)
            echo "TODO";
            exit 1;
            ;;
      prod)
            echo "TODO";
            exit 1;
            ;;
      *)
            echo "missing <test|stage|prod>" && exit 1;
            ;;
  esac
}


pring_usage () {
  echo "[HELP]:";
  echo "";
  echo "r -> run container";
  echo "b -> build container";
  #TODO echo "d -> deploy <env>";
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
      r)
          run_container;
          ;;
      d)
          read -p "environment: <test|stage|prod> ? " env
          echo $env
          deploy $env
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
