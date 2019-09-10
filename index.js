const AWS = require('aws-sdk');

const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
app.use(fileUpload());
AWS.config.loadFromPath('./credentials.json');
AWS.config.update({region: 'us-west-2'});

var rekognition = new AWS.Rekognition();

function searchByImage(image, cb) {
  var params = {
    CollectionId: "rachel-compare-face", 
  
    Image: {
       Bytes: image.data.buffer
    }
  };

rekognition.searchFacesByImage(params, function(err, data) {
  if (err) {
    console.log(err, err.stack); // an error occurred

    cb([]);
  }
  else     {
    console.log(data); 
    const imageMatches = data.FaceMatches.filter(function(match) { return match.Face.ExternalImageId !== undefined;})
    .map(function (image) { return image.Face.ExternalImageId;})
    .map(function (s3ObjectKey) { return 'https://compare-face.s3-us-west-2.amazonaws.com/' + s3ObjectKey;})

    cb(imageMatches);
  }          // successful response
});
}




app.use(express.static('public'));


app.post('/upload', function(req, res) {

    console.log("uploading file");

    if (!req.files) {
      return res.status(400).send('No files were uploaded.');
    }
    
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    const uploadedImage = req.files.faceToSearch;
    
    searchByImage(uploadedImage, function(images) {

      var html = "<html><body>"

      images.forEach(function(imageSrc){
        html = html + "<img src = '" + imageSrc + "'/>"
      })
   

      html = html + "</body></html>"
      res.send('faces found: '+html)
    })
  });
  app.listen(3000);