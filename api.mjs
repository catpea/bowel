import fs from 'fs';

export default { jsonParse, dirParse, };


async function jsonParse(target){
  return JSON.parse(fs.readFileSync(target).toString());
}

async function dirParse(){

}
