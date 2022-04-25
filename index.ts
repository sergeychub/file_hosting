import express, { Response } from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import sharp from "sharp";
import fs from "fs";
import shortid from "shortid";
const app = express();
const port = 9090;

app.use(cors());
app.use(express.json());
app.use(fileUpload());

async function uploadImage(buffer: Buffer, res: Response) {
  const path = "images";
  const data = await sharp(buffer).webp().toBuffer();
  const newName = shortid.generate();
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
  fs.appendFile(`${path}/${newName}.webp`, data, (err) => {
    if (err) return res.status(500).send(err.message);
    return res.json({ name: `${newName}.webp` });
  });
}

async function uploadPDF(buffer: Buffer, res: Response) {
  const path = "pdf";
  const newName = shortid.generate();
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
  fs.appendFile(`${path}/${newName}.pdf`, buffer, (err) => {
    if (err) res.status(500).send(err.message);
    return res.json({ name: `${newName}.pdf` });
  });
}

async function uploadFile(buffer: Buffer, res: Response, type: string) {
  const newName = shortid.generate();
  fs.appendFile(`${newName}.${type}`, buffer, (err) => {
    if (err) res.status(500).send(err.message);
    return res.json({ name: `${newName}.${type}` });
  });
}

app.delete("/img", async (req, res) => {
  const name = req.body.name;
  fs.unlink(`images/${name}`, (err) => {
    console.log(err);
  });
  res.send("Файл удален!");
});
app.delete("/pdf", async (req, res) => {
  const name = req.body.name;
  fs.unlink(`pdf/${name}`, (err) => {
    console.log(err);
  });
  res.send("Файл удален!");
});
app.delete("/file", async (req, res) => {
  const name = req.body.name;
  fs.unlink(`${name}`, (err) => {
    console.log(err);
  });
  res.send("Файл удален!");
});

app.post("/upload", async (req, res) => {
  if (!req.files || !req.files.file || Array.isArray(req.files.file)) return;
  const mimetype = req.files.file.mimetype.split("/");
  const nameArray = req.files.file.name.split(".");
  const mime = mimetype[0];
  const type = nameArray[nameArray.length - 1];
  if (mime === "image") {
    await uploadImage(req.files.file.data, res);
  } else {
    switch (type) {
      case "pdf":
        uploadPDF(req.files.file.data, res);
        break;
      default:
        uploadFile(req.files.file.data, res, type);
        break;
    }
  }
});

app.get("/:route/:fileName", async (req, res) => {
  const route = req.params.route;
  const fileName = req.params.fileName;
  const path = `${__dirname}/${route}/${fileName}`;
  if (fs.existsSync(path)) {
    res.sendFile(path);
  } else {
    res.status(500).send(`Файла не существует`);
  }
});
app.get("/:fileName", async (req, res) => {
  const fileName = req.params.fileName;
  const path = `${__dirname}/${fileName}`;
  if (fs.existsSync(path)) {
    res.download(path);
  } else {
    res.status(500).send(`Файла не существует`);
  }
});

app.listen(port, () => {
  console.log(`Слушаю порт ${port}`);
});
