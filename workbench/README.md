
## How to run it

### Run it in docker 
```bash
  ./cli.sh build
```

### Run locally
1. start frontend 
2. start backend 
3. open http://localhost:4200 in browser

#### run frontend 
```bash 
cd frontend
npm i 
npm run start
# now running on http://localhost:4200
```

#### run backend 
```bash 
cd backend
npm i 
npm run start:dev
# now running on http://localhost:8000
```

##### configuration options

create a `.env`-file in `/backend`-folder 

```bash
PORT=8000
MODE=local
VERBOSE=true
OVERWRITE_OPTIMISATION_HOST=http://localhost:2020
```