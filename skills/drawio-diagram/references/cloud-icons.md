# Cloud Architecture Icons Reference

> AWS, GCP, and Azure icon styles for draw.io diagrams

## Overview

Draw.io supports cloud provider icons through shape libraries. Claude models (especially Claude Sonnet/Opus) are trained on these icon patterns.

---

## AWS Icons

### AWS 2025 Icons (Recommended)

Use the `mxgraph.aws4.*` shape family for AWS 2025 icons.

#### Common AWS Shapes

| Service | Shape Style |
|---------|-------------|
| EC2 | `shape=mxgraph.aws4.ec2;` |
| S3 | `shape=mxgraph.aws4.s3;` |
| RDS | `shape=mxgraph.aws4.rds;` |
| Lambda | `shape=mxgraph.aws4.lambda;` |
| API Gateway | `shape=mxgraph.aws4.api_gateway;` |
| VPC | `shape=mxgraph.aws4.vpc;` |
| CloudFront | `shape=mxgraph.aws4.cloudfront;` |
| DynamoDB | `shape=mxgraph.aws4.dynamodb;` |
| SQS | `shape=mxgraph.aws4.sqs;` |
| SNS | `shape=mxgraph.aws4.sns;` |
| ECS | `shape=mxgraph.aws4.ecs;` |
| EKS | `shape=mxgraph.aws4.eks;` |
| Load Balancer | `shape=mxgraph.aws4.application_load_balancer;` |

#### AWS Group Containers

```xml
<!-- AWS Cloud container -->
<mxCell id="aws_cloud" value="AWS Cloud" 
        style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud_alt;strokeColor=#232F3E;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#232F3E;dashed=0;" 
        vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="600" height="400" as="geometry"/>
</mxCell>

<!-- VPC container -->
<mxCell id="vpc" value="VPC" 
        style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc;strokeColor=#248814;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#248814;dashed=0;" 
        vertex="1" parent="aws_cloud">
  <mxGeometry x="20" y="40" width="560" height="340" as="geometry"/>
</mxCell>
```

#### AWS Example

```xml
<!-- EC2 Instance -->
<mxCell id="ec2_1" value="Web Server" 
        style="sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;gradientColor=#F78E04;gradientDirection=north;fillColor=#D05C17;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ec2;" 
        vertex="1" parent="1">
  <mxGeometry x="200" y="150" width="78" height="78" as="geometry"/>
</mxCell>
```

---

## GCP Icons

### Shape Family: `mxgraph.gcp2.*`

#### Common GCP Shapes

| Service | Shape Style |
|---------|-------------|
| Compute Engine | `shape=mxgraph.gcp2.compute_engine;` |
| Cloud Storage | `shape=mxgraph.gcp2.cloud_storage;` |
| Cloud SQL | `shape=mxgraph.gcp2.cloud_sql;` |
| Cloud Functions | `shape=mxgraph.gcp2.cloud_functions;` |
| Kubernetes Engine | `shape=mxgraph.gcp2.kubernetes_engine;` |
| BigQuery | `shape=mxgraph.gcp2.bigquery;` |
| Pub/Sub | `shape=mxgraph.gcp2.pubsub;` |
| Cloud Run | `shape=mxgraph.gcp2.cloud_run;` |

#### GCP Example

```xml
<mxCell id="gce_1" value="GCE Instance" 
        style="shape=mxgraph.gcp2.compute_engine;html=1;whiteSpace=wrap;fillColor=#4285F4;strokeColor=none;" 
        vertex="1" parent="1">
  <mxGeometry x="200" y="150" width="80" height="80" as="geometry"/>
</mxCell>
```

---

## Azure Icons

### Shape Family: `mxgraph.azure.*`

#### Common Azure Shapes

| Service | Shape Style |
|---------|-------------|
| Virtual Machine | `shape=mxgraph.azure.virtual_machine;` |
| Blob Storage | `shape=mxgraph.azure.blob_storage;` |
| SQL Database | `shape=mxgraph.azure.sql_database;` |
| Functions | `shape=mxgraph.azure.function_apps;` |
| AKS | `shape=mxgraph.azure.kubernetes_services;` |
| App Service | `shape=mxgraph.azure.app_services;` |
| Load Balancer | `shape=mxgraph.azure.load_balancer;` |
| VNet | `shape=mxgraph.azure.virtual_network;` |

#### Azure Example

```xml
<mxCell id="vm_1" value="Web VM" 
        style="shape=mxgraph.azure.virtual_machine;fillColor=#0078D4;strokeColor=none;html=1;whiteSpace=wrap;" 
        vertex="1" parent="1">
  <mxGeometry x="200" y="150" width="80" height="80" as="geometry"/>
</mxCell>
```

---

## Generic Cloud Patterns

### User/Client Icon

```xml
<mxCell id="user" value="Users" 
        style="shape=mxgraph.aws4.users;html=1;whiteSpace=wrap;fillColor=#232F3E;strokeColor=none;" 
        vertex="1" parent="1">
  <mxGeometry x="40" y="200" width="60" height="60" as="geometry"/>
</mxCell>
```

### Internet/Globe

```xml
<mxCell id="internet" value="Internet" 
        style="ellipse;shape=cloud;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;" 
        vertex="1" parent="1">
  <mxGeometry x="40" y="180" width="100" height="80" as="geometry"/>
</mxCell>
```

### Database (Generic)

```xml
<mxCell id="db" value="Database" 
        style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#dae8fc;strokeColor=#6c8ebf;" 
        vertex="1" parent="1">
  <mxGeometry x="200" y="150" width="80" height="100" as="geometry"/>
</mxCell>
```

---

## Best Practices

1. **Use AWS 2025 icons** - Claude is trained on these patterns
2. **Consistent icon sizes** - Use 78x78 or 80x80 for service icons
3. **Group containers** - Use cloud/VPC/subnet containers for organization
4. **Color coding** - Follow provider color schemes:
   - AWS: Orange (#FF9900), Dark (#232F3E)
   - GCP: Blue (#4285F4), Red (#EA4335), Yellow (#FBBC05), Green (#34A853)
   - Azure: Blue (#0078D4)

---

## Common Architecture Patterns

### Three-Tier Web Architecture

```
[Users] → [Load Balancer] → [Web Servers] → [App Servers] → [Database]
                               ↓
                          [Cache Layer]
```

### Microservices

```
[API Gateway] → [Service A] → [Queue] → [Service B]
      ↓              ↓                       ↓
[Auth Service]  [Database A]           [Database B]
```

### Event-Driven

```
[Event Source] → [Queue/Stream] → [Function] → [Storage]
                                      ↓
                               [Notification]
```
