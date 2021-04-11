import fs from 'fs';
import path from 'path';

export default { jsonParse, toDirs, };


async function toDirs(so){
    const baseDirectory = so.name;

    for(const item of so.data){
      const recordDirectory = item.id;
      const basePath = path.join('.', baseDirectory, recordDirectory)
      console.log(basePath);
    }

}

async function jsonParse(target){
  return JSON.parse(fs.readFileSync(target).toString());
}

async function getSchema(so){
  const schema = {keys:[], data:{}, count: 0};
  Object.keys(so).filter(i=>(typeof so[i] === 'string')).map(i=>schema[i]=so[i]);
  schema.count = so.data.length;
  for(let key of Object.keys(so)){
      schema.keys.push(key);
  }
  for(let file of so.data){
    for(let key of Object.keys(file)){
        if(!schema.data[key]) schema.data[key] = 0;
        schema.data[key]++
    }
  }
  return schema;
}
