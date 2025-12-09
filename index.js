const express = require("express")
const fs = require("fs")
const cors = require("cors")
const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "web/images/posters");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);  
        cb(null, Date.now() + ext);                   
    }
});

const upload = multer({ storage })
const clients = []

const app = new express()
app.use(express.json())
app.use(express.static("web"))
app.use(cors())

function fixTimes(date, method){
    if(method == 1){
        //turn 6 -> 06
        if (date < 10){
            date = `0${date}`
        }

        return date
    } else if (method == 2){
        // turn 06:66:66 -> 6:66
        let splitDate = date.split(":").slice(0, -1)
        splitDate[0] = fixTimes(splitDate[0].replace("0", ""), 3)

        return splitDate.join(":")
    } else if(method == 3){
        // turn 23 -> 11
        if (date > 12){
            date = date - 12
        }

        return date
    }
}


app.get("/fetch-posters", (req, res) => {
    posters = fs.readFileSync("./posters.json", "utf8")
    res.send(posters)
})

app.post("/upload-poster", upload.single('poster'), (req,res) => {
    posters = JSON.parse(fs.readFileSync("./posters.json", "utf8"))
    posters[req.body.nickname] = (`images/posters/${req.file.filename}`)
    
    fs.writeFileSync("./posters.json", JSON.stringify(posters), "utf8")

    clients.forEach(client => {
        client.write(`data: poster changed\n\n`);
    });
    
    res.redirect("/control-panel")
})

app.post("/delete-poster", (req, res) => {
    console.log(req)
    posters = JSON.parse(fs.readFileSync("./posters.json", "utf8"))
    delete posters[req.body.name]

    fs.writeFileSync("./posters.json", JSON.stringify(posters), "utf8")

    clients.forEach(client => {
        client.write(`data: posters-updated\n\n`);
    });

    res.redirect("/control-panel")
})

app.get("/update-prayer-times", (req, res) => {
    console.log(req.query)
    let times = {
        "Fajr": {
            "Adhan": req.query.fajr_begins, 
            "Iqamah": req.query.fajr_jamah,
            "IDs": ["fajr_adhan", "fajr_iqamah"],
            "Suffix": "am"
        },
        "Dhuhr": {
            "Adhan": req.query.zuhr_begins,
            "Iqamah": req.query.zuhr_jamah, 
            "IDs": ["dhuhr_adhan","dhuhr_iqamah"],
            "Suffix": "pm"
        },
        "Asr": {
            "Adhan": req.query.asr_mithl_2, 
            "Iqamah": req.query.asr_jamah, 
            "IDs": ["asr_adhan","asr_iqamah"],
            "Suffix": "pm"
        },
        "Maghrib": {
            "Adhan": req.query.maghrib_begins,
            "Iqamah": req.query.maghrib_jamah,
            "IDs": ["maghrib_adhan","maghrib_iqamah"],
            "Suffix": "pm"
        },
        "Isha": {
            "Adhan": req.query.isha_begins, 
            "Iqamah": req.query.isha_jamah,
            "IDs": ["isha_adhan", "isha_iqamah"],
            "Suffix": "pm"
        }
    }

    clients.forEach(client => {
        console.log(times)
        client.write(`data: ${JSON.stringify(times)}\n\n`)
    })

    res.redirect("/control-panel")
})

app.get("/", (req, res) => {
    res.sendFile("/web/html/index.html", { root: __dirname })
})

app.get("/control-panel", (req, res) => {
    res.sendFile("/web/html/control-panel.html", { root: __dirname })
})

app.get("/update", (req,res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    clients.push(res);

    req.on('close', () => {
        const index = clients.indexOf(res);
        if (index !== -1) clients.splice(index, 1);
    });
})

app.listen(3000, () => {
    console.log("Server running")
})