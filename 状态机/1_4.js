// 不准使用正则表达式，纯粹用 JavaScript 的逻辑实现：在一个字符串中，找到字符“ab”
function match(string){
  let foundA = false;
  for(let c of string){
    if(c=='a') foundA = true;
    else if(foundA && c == 'b') return true;
    else foundA = false;
  }
  return false;
}

console.log(match('i acbm groot'))