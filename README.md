# SAP Field Service Management - Intelligent Scheduling Samples

[![REUSE status](https://api.reuse.software/badge/github.com/SAP-samples/fsm-scheduling-samples)](https://api.reuse.software/info/github.com/SAP-samples/fsm-scheduling-samples)

# About this repository

In this repository you will find example code, code snippet and a example scheduling workbench-app application to work with SAP FSM APIs for advanced scheduling use cases and reference implementation for integration scenarios.

related: 
- [SAP Field Service Management - Product Website](https://www.sap.com/germany/products/field-service-management.html)
- [SAP Field Service Management - AI-based Scheduling](https://help.sap.com/viewer/fsm_ai/Cloud/en-US/ai-based-scheduling-overview.html)
# Requirements

to use the examples in this repository you will need a SAP FSM account with admin-role data access with account (id & name) / company (id & name)  / user (id & name) as well as the name of the data-cluster (eu|de|us|au|cn)

- docker 19.x
- nodejs v10.x
- npm v6.9.x


# Getting started, Download and Installation

## run workbench-app locally

use the cli the following command in the `/workbench-app`-folder
```bash
./cli.sh 
```

using pre build docker container 
```
docker run --rm -e PORT=3000 -p 3000:3000 --name fsm-scheduling-samples gausim/fsm-scheduling-samples:latest
```


# Configuration

# Limitations
- refer to [constraints and limitations](https://help.sap.com/viewer/fsm_ai/Cloud/en-US/constraints-limitations.html) documentation

# Known Issues
There are no known issues for the moment.

# How to obtain support

## Product support
- In case you need further help, check out the [SAP Field Service Management Help Portal](https://help.sap.com/viewer/product/SAP_FIELD_SERVICE_MANAGEMENT/Cloud/en-US) or report and incident in [SAP Support Portal](https://support.sap.com) with the component "CEC-SRV-FSM".

## Technical request 
- [https://developers.sap.com/](https://developers.sap.com) and developers@sap.com

- technical questions about code in this repository, please open an issue [here](https://github.com/SAP-samples/fsm-scheduling-samples/issues/new)

## Related documentation 

- [Sample Business Rules for Optimization](https://help.sap.com/viewer/fsm_ai/Cloud/en-US/optimization-business-rules.htm)
- [Optimization API](https://eu.coresystems.net/optimization/api/v1/swagger-ui/#/)
- [Service Management API](https://help.sap.com/viewer/fsm_service_api/Cloud/en-US/service-api-overview.html) [Spec](https://app.swaggerhub.com/apis/coresystemsFSM/ServiceManagementAPI) 


# Contributing

Want to contribute? Check out our [contribution](./CONTRIBUTING.md) guide and follow our [code of conduct](./CODE_OF_CONDUCT).

# License
Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](./LICENSE) file.
