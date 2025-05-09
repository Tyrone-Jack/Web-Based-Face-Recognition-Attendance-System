# Facial Recognition with JavaScript using face-api.js
### To start up the app:
1. run npm install in the root directory
2. run node on server.js
3. go to http://localhost:5001

### [Face API Github](https://github.com/justadudewhohacks/face-api.js)

### Loading 4 primary models
``` javascript
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
        faceapi.nets.ageGenderNet.loadFromUri('./models'),
    ])
```
