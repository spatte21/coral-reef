#coral-reef

A REST api exposing information about build, deployment and automated testing activities.  The following sections cover each of the routes.

##build

To get a list of all builds...
```
GET http://coral-reef.azurewebsites.net/build
```

To create a new build...
```
POST http://coral-reef.azurewebsites.net/build

Body:
{ 
  buildId: String, 
  branch: String
} 
```

##deployment

To get a list of all deployments for a particular build (queued, completed or otherwise)...
```
GET http://coral-reef.azurewebsites.net/deployment/:buildId
```

To get the list of builds queued up for deployment...
```
GET http://coral-reef.azurewebsites.net/deployment/queue
```

To see the next build to be deployed (like a _peek_ - it doesn't change the queue in anyway)...
```
GET http://coral-reef.azurewebsites.net/deployment/queue/next
```

To remove the next build to be deployed from the deployment queue (this will set the _started_ field to the current time and return the deployment record, implying that the deployment process has been started)...
```
PUT http://coral-reef.azurewebsites.net/deployment/queue/pop
```

To update the record once deployment has completed...
```
PUT http://coral-reef.azurewebsites.net/deployment/:buildId

Body:
{
  environment: String,
  urUrl: String,
  onlineRecruitmentUrl: String,
  mobileUrl: String,
  snapshotName: String,
  snapshotFile: String
}
```

##testresult

To get the next test suite to be run (like a _peek_ - it doesn't change the queue in anyway)...
```
GET http://coral-reef.azurewebsites.net/testResult/next
