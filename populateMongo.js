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
  return await axios.post(
    `${SERVER_URL}/api/add`,
    JSON.stringify(jsonData),
    {
      headers: {
        'content-type': 'application/json',
        'X-API-Key': SERVER_KEY,

      }
    }
  )

}

const res = await uploadFile(await readFile("example.json"));
console.log(res)