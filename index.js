const express =require('express')
const multer= require('multer')
const csv= require('fast-csv')
const fs= require('fs')
const app=express();
const mongodb=require('mongodb')


global.__basedir = __dirname;

//multer upload 
const storage= multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null, file.filename + "-"+ Date.now() + "-" +file.originalname)
    }
});

const csvFilter= (req,file, cb)=>{
    if(file.mimetype.includes('csv')){
        cb(null,true);

    }
    else{
        cb('please upload only csv file',false)
    }
};
const upload = multer({storage:storage, fileFilter:csvFilter})



app.post('/api/upload-csv-file',upload.single('file'),(req,res)=>{
    if(req.file==undefined){
        res.send({responseCode:400,responseMessage:"please upload a csv file!"})
    }
 })
 
 let csvData=[]
 let filePath = __basedir +'/uploads/'+ req.file.filename;
 fs.createReadStream(filePath)
 .pipe(csv.parse({headers:true}))
 .on('error',(error)=>{
     throw error.message;
 
 })
 .on('data',(row)=>{
     csvData.push(row);
 })
 .on('end'), ()=>{
      var url= "mongodb://localhost:27017/csv_database1"
      var dbconn
      mongodb.connect(url,{useUnifiedTopology:true})
      .then((client)=>{
          console.log('db connected');
          dbconn=client.db();
           var collectionName= 'clients'
           var collection =dbconn.collection(collectionName)
           collection.insertMany(csvData,(err,result)=>{
               if(err)console.log(err)
               if(result){
                   res.status(200).send({
                       message:"uploa/import the csv data into database sucessfully" + req.file.originalname,
                 
                     })
               }
           })
      }).catch(err =>{
          res.status(500).send({
              message: "failed to import",
              error:err.message
          })
      })
     }
   // fetch api
   
     
 app.get('/api/client',function (req,res){
     var url ="mongodb://localhost:27017/csv_database1"
     var dbconn;
     mongodb.MongoClient.connect(url,{
         useUnifiedTopology:true,
 
     }).then((client)=>{
         dbconn=client.db();
         var collectionName="clients";
         var collection =dbconn.collection(collectionName);
         collection.find().toArray(function(err, result){
             if (err) throw err;
             res.status(200).send({clients:result})
             client.close();
 
         })
     }).catch(err =>{
 
     res.status(500).send({
         message:"failed to fetch ",
         error: err.message
     })
     })
 })
 
 app.listen(5252,()=>{
     console.log('server is runing on 5252')
 })


