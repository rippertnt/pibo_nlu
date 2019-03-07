let ss = require('string-similarity');
var mecab = require('mecab-ffi');

let arr = ['오늘 날씨는 어때?','뉴스좀 알려줘.','스토리 검색해서 알려줘.'];
console.error('TARGET',arr.toString());

let query1 = '오늘 뉴스 어때?';
//let query2 = '오늘은 내일의 뉴스, 어제는 그제 아름다운 뉴스 어때?';

let query2 = '뉴스 싫어';
let query3 = '오늘 날씨보다는 스토리를 검색해 주는건 어때?';


console.log('----- OLD Natural Language Understanding -----');
/*
var matches = ss.findBestMatch(query1, arr);
console.log(matches);
console.log('OLD Q',query1 + ' /A ' + matches.bestMatch.target);
var matches = ss.findBestMatch(query2, arr);
console.log('OLD Q',query2 + ' /A ' + matches.bestMatch.target);
var matches = ss.findBestMatch(query3, arr);
console.log('OLD Q',query3 + ' /A ' + matches.bestMatch.target);

console.log('----- NEW Natural Language Understanding -----');
*/
/*
findBestMatch(query1,arr).then((res)=>{
  console.log('NEW Q',query1 + ' /A ' + res.bestMatch.target);
  console.log(res);
})
*/


query2 = '좋은 날씨 좀 알려줘';

async function test(){

  matches = await findBestMatch(query2,['응','아니','맞아','아니야','싫어','좋아'])
  console.log('NEW Q',query2 + ' ' + query2.length + ' /A ' + matches.bestMatch.target + ' / ' + matches.bestMatch.target.length);
  console.log(matches);
}

test();

/*
findBestMatch(query3,arr).then((res)=>{
  console.log('NEW Q',query3 + ' /A ' + res.bestMatch.target);
  //console.log(res);
})
*/

let stops = ['은','는','이','가','하','아','것','들','의','있','되','수','보','주','등','한'];
let neg_arr = ['멈추','싫','말','아니'];
let pos_arr = ['응'];

/*
mecab.parse('응', function(err, result) {
  console.log('MECAB', result);
});
*/

//let query = '오늘은 아름다운 뉴스를 알려줘.';

const th =  {
  N : 4,
  M : 2,
  V : 2,
  I : 1,
  X : 1
};

async function findBestMatch(query, arr){
  //console.log('Source',query);
  let target = {};
  let result = {};
  let ratings = [];
  let mp = 1;

  target = await pre_process(query);

  let M = Object.keys(target.M);
  let N = Object.keys(target.N);
  let V = Object.keys(target.V);
  let I = Object.keys(target.I);
  let X = Object.keys(target.X);  

  let length = N.length + M.length + V.length + I.length + X.length;

  if(length < 2){
    mp = 3;
  } else if(length < 4){
    mp = 2;
  } else {
    mp = 1;
  }

  for(let i = 0 ; i < arr.length ; i++){
    let txt = arr[i];
    result[txt] = 0;

    let cmd = await pre_process(txt);
    
    let Ns = Object.keys(cmd.N);
    let Ms = Object.keys(cmd.M);
    let Vs = Object.keys(cmd.V);
    let Is = Object.keys(cmd.I);
    let Xs = Object.keys(cmd.X);

    result[txt] += compare(N,Ns, th.N * mp);   
    result[txt] += compare(M,Ms, th.M * mp);  
    result[txt] += compare(V,Vs, th.V * mp);  
    result[txt] += compare(I,Is, th.I * mp);  
    result[txt] += compare(X,Xs, th.X * mp);  

    if(result[txt] > 1){
      ratings.push({ target : txt, rating : result[txt]/10});
    }
  }

  ratings.sort((a,b)=>{
    return b.rating - a.rating;
  })

  let max_str = arr[0];
  let max_score = 0;

  let results = Object.keys(result);
  for(let i = 0 ; i < results.length ; i++){
    if(result[results[i]] >= max_score){
      max_score = result[results[i]];
      max_str = results[i];
    }
  }

  return { bestMatch : { target : max_str, rating : max_score/10, isNegative : target.isNegative, keywords : target.NN}, ratings, type : target}
}

function compare(arr1, arr2, score){
  let result = 0;

  if(!score){
    score = 1;
  }

  for(let i = 0 ; i < arr1.length ; i++){
    if(arr2.indexOf(arr1[i]) > -1){
      result += score;
    }
  }

  return result;
}


/*


    let Ns = Object.keys(cmd.N);
    let Ms = Object.keys(cmd.M);
    let Vs = Object.keys(cmd.V);
    let Is = Object.keys(cmd.I);
    let Xs = Object.keys(cmd.X);

*/

let list = ['M','N','V','I','X','S'];
function pre_process(query){
  return new Promise((res, rej)=> {

    let cmds = { M : {}, N : {}, V : {}, I : {}, X : {}, S : {}, isNegative : false };
    // parsing
    mecab.parse(query, function(err, results) {
      //console.log('CLEAN',results);
  
      for(let i = 0 ; i < results.length ; i++){
        let item = results[i];
        
        if(!item[1])
          continue;        


        list.forEach(type => {
          if(item[1].indexOf(type) > -1){
            if(item[6].indexOf(type) > -1){
              set(cmds[type], item[8].split('/')[0]);
            } else {
              set(cmds[type], item[0]);
            }
          }             
        });
      }

      res(cmds);
    });
  });
}


/*
function pre_process(query){
  return new Promise((res, rej)=> {

    let cmds = { M : {}, N : {}, V : {}, I : {}, X : {}, S : {}, isNegative : false };

    mecab.parse(query, function(err, results) {
      //console.log(results);
            
      // cleaning
      for(let i = 0 ; i < results.length ; i++){
        let item = results[i];

        //console.log(item[8].split('/')[0]);
        if(neg_arr.indexOf(item[8].split('/')[0]) > -1){
          //console.log('NEGATIVE......',item[8])
          cmds.isNegative = true;
        }        
    
        if(item[1].indexOf('J') > -1) {
          //console.log('REMOVE J',item[0]);
          query = query.replace(item[0],'');
        }
        
        for(let j = 0 ; j < stops.length ; j++){
          let stop = stops[j];
    
          if(item[0] == stop){
            query = query.replace(stop,'');
          }
        }
      }
    
      // parsing
      mecab.parse(query, function(err, results) {
        //console.log('CLEAN',results);
    
        for(let i = 0 ; i < results.length ; i++){
          let item = results[i];
          
          if(!item[1])
            continue;        


          list.forEach(type => {
            if(item[1].indexOf(type) > -1){
              if(item[6].indexOf(type) > -1){
                set(cmds[type], item[8].split('/')[0]);
              } else {
                set(cmds[type], item[0]);
              }
            }             
          });
        }

        res(cmds);
      });
    });
  });
}
*/

exports.getNounMap = (query)=>{
  let noun = {};
  let nnp = '';
  
  return new Promise((res,rej)=>{
    mecab.parse(query, function(err, results) {
      //console.log('CLEAN',results);
  
      for(let i = 0 ; i < results.length ; i++){
        let item = results[i];
        
        if(!item[1])
          continue;          
  
        if(item[1].indexOf('N') > -1){
          if(item[1] == 'NNG'){
            noun[item[0]] = 1;
          } else if(item[6] == 'NNG'){
            noun[item[8].split('/')[0]] = 1;
          } else if(item[1] == 'NNP'){
            noun[item[0]] = 1;
            nnp += item[0];
          } else if(item[6] == 'NNP'){
            noun[item[8].split('/')[0]] = 1;
            nnp += item[8].split('/')[0];
          }
        } else if(item[1].indexOf('IC') > -1 ){
          noun[item[0]] = 1;
        }  else if(item[1].indexOf('SL') > -1 ){ // 외국어 // 한자 SH, 숫자 SN
          noun[item[0]] = 1;
        }
      }
      
      noun[nnp] = 1;

      res(noun);
    });    
  });
}

function set(obj, key){
  if(obj[key]){
    obj[key] += 1;
  } else {
    obj[key] = 1;
  }
}