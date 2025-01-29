import fs from "fs";
import axios from "axios";
import { configDotenv } from "dotenv";
configDotenv();

const { SERVER_URL, SERVER_KEY } = process.env; 

async function readFile(fileName) {
  var jsonData = fs.readFileSync(fileName)
  jsonData = await JSON.parse(jsonData); 

  return jsonData; 
}

async function uploadFile(jsonData) {
  await axios.post(
    `${SERVER_URL}/add`,
    JSON.stringify(jsonData),
    {
      headers: {
        'content-type': 'application/json',
        'X-API-Key': SERVER_KEY,

      }
    }
  )
  
}

await uploadFile(await readFile("example.json"));