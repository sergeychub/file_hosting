import express, { Response } from "express";
import * as fs from "fs";
import * as shortid from "shortid";
import http from "axios";
const app = express();
const port = 9090;
const sharp = require("sharp");
const fileUpload = require("express-fileupload");
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(fileUpload());

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

async function loadByUrl(url: string, res: Response) {
  const buffer = (await http.get(url, { responseType: "arraybuffer" })).data;
  uploadImage(buffer, res);
  return;
}

async function uploadImage(buffer: Buffer, res: Response) {
  const path = `${process.cwd()}/public/images`;
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
  const path = `${process.cwd()}/public/pdf`;
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
  fs.unlink(`${process.cwd()}/public/images/${name}`, (err) => {
    console.log(err);
  });
  res.send("Файл удален!");
});
app.delete("/pdf", async (req, res) => {
  const name = req.body.name;
  fs.unlink(`${process.cwd()}/public/pdf/${name}`, (err) => {
    console.log(err);
  });
  res.send("Файл удален!");
});
app.delete("/file", async (req, res) => {
  const name = req.body.name;
  fs.unlink(`${process.cwd()}/public/${name}`, (err) => {
    console.log(err);
  });
  res.send("Файл удален!");
});
app.post("/upload", async (req, res) => {
  console.log(req.files, "files");
  console.log(req.body, "body");
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
app.post("/upload_url", async (req, res) => {
  if (!req.body.url) return res.status(500).send("Нет ссылки на файл");
  const url = req.body.url;
  loadByUrl(url, res);
  return;
});

app.listen(port, () => {
  console.log(`Слушаю порт ${port}`);
});
