const express = require("express");
const app = express();
const axios = require("axios");
const multer = require("multer");
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static('Public'))

app.get('/addBlog', (req, res) =>{
    res.render('addBlog')
})

app.get('/signUp&signIn', (req, res) =>{
    res.render('signUp&signIn')
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './Public/uploads/'); 
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });

app.post('/addingBlog', upload.single("image"), (req, res) =>{
    const {title, description, author} = req.body 
    const image = req.file;  
    console.log(image)
    const newBlog = {
        title: title,
        description: description,
        author: author,
        image: image.filename
    }
    // console.log(newBlog)
    axios.post('http://localhost:8500/Blog', newBlog)
    res.redirect('/allBlogs')
    res.end()

})

app.get('/allBlogs', async (req,res)=>{
    let fetchBlogs = await axios.get('http://localhost:8500/Blog')
    let blogs =await fetchBlogs.data
    // console.log(blogs) 
    res.render('allBlogs',{blogs})
})

app.use((req,res,next) =>res.render('404'))

app.listen(PORT, () =>{
    console.log(`Server listening on port ${PORT}`)
});
