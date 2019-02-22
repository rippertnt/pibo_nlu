let ss = require('string-similarity');
var mecab = require('mecab-ffi')
let arr = ['오늘 날씨는 어때?','뉴스좀 알려줘.','스토리 검색해서 알려줘.'];
console.error('TARGET',arr.toString());

let query1 = '오늘 뉴스 어때?';
//let query2 = '오늘은 내일의 뉴스, 어제는 그제 아름다운 뉴스 어때?';

let query2 = '뉴스 싫어';
let query3 = '오늘 날씨보다는 스토리를 검색해 주는건 어때?';

console.log('----- OLD Natural Language Understanding -----');

var matches = ss.findBestMatch(query1, arr);
console.log(matches);
console.log('OLD Q',query1 + ' /A ' + matches.bestMatch.target);
var matches = ss.findBestMatch(query2, arr);
console.log('OLD Q',query2 + ' /A ' + matches.bestMatch.target);
var matches = ss.findBestMatch(query3, arr);
console.log('OLD Q',query3 + ' /A ' + matches.bestMatch.target);

console.log('----- NEW Natural Language Understanding -----');

/*
findBestMatch(query1,arr).then((res)=>{
  console.log('NEW Q',query1 + ' /A ' + res.bestMatch.target);
  console.log(res);
})
*/
async function test(){

  matches = await findBestMatch(query2,arr)
  console.log('NEW Q',query2 + ' /A ' + matches.bestMatch.target);
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
let negs = ['멈추','싫','말'];

/*
mecab.parse('오늘 뉴스 어때?', function(err, result) {
  console.log(result);
});
*/

//let query = '오늘은 아름다운 뉴스를 알려줘.';



async function findBestMatch(query, arr){
  //console.log('Source',query);
  let target = {};
  let result = {};
  let ratings = [];

  target = await pre_process(query);

  for(let i = 0 ; i < arr.length ; i++){
    let txt = arr[i];
    result[txt] = 0;

    let cmd = await pre_process(txt);
    let MAs = Object.keys(cmd.MA);
    let NNs = Object.keys(cmd.NN);
    let VAs = Object.keys(cmd.VA);
    let VVs = Object.keys(cmd.VV);

    let MA = Object.keys(target.MA);
    let NN = Object.keys(target.NN);
    let VA = Object.keys(target.VA);
    let VV = Object.keys(target.VV);
    
    result[txt] += compare(MA,MAs, 2);  
    result[txt] += compare(NN,NNs, 4);  
    result[txt] += compare(VA,VAs, 1);  
    result[txt] += compare(VV,VVs, 1);  

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
    if(result[results[i]] > max_score){
      max_score = result[results[i]];
      max_str = results[i];
    }

  }

  return { bestMatch : { target : max_str, rating : max_score/10, isNegative : target.isNegative, keywords : target.NN}, ratings, type : target}

  //return { text : max_str, score : max_score, target};
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

function pre_process(query){
  return new Promise((res, rej)=> {

    let cmds = { MA : {}, NN : {}, VA : {}, VV : {}, isNegative : false };

    mecab.parse(query, function(err, results) {
      //console.log(results);
            
      // cleaning
      for(let i = 0 ; i < results.length ; i++){
        let item = results[i];

        //console.log(item[8].split('/')[0]);
        if(negs.indexOf(item[8].split('/')[0]) > -1){
          console.log('NEGATIVE......',item[8])
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
    
          if(item[1].indexOf('MA') > -1){
            if(item[1] == 'MAG'){
              set(cmds.MA, item[0]);// cmds.MA[item[0]] = 1;
            } else if(item[6] == 'MAG'){
              //cmds.MA[item[8].split('/')[0]] = 1;
              set(cmds.MA, item[8].split('/')[0]);
            }
          } else if(item[1].indexOf('VA') > -1){
            if(item[1] == 'VA'){
              set(cmds.VA, item[0]);
              //cmds.VA[item[0]] = 1;

              if(negs.indexOf(item[0]) > -1){
                cmds.isNegative = true;
              }

            } else if(item[6] == 'VA'){
              //cmds.VA[item[8].split('/')[0]] = 1;
              set(cmds.VA, item[8].split('/')[0]);
            }       
          } else if(item[1].indexOf('VV') > -1){
            if(item[1] == 'VV'){
              //cmds.VV[item[0]] = 1;
              set(cmds.VV, item[0]);

              if(negs.indexOf(item[0]) > -1){
                cmds.isNegative = true;
              }

            } else if(item[6] == 'VV'){
              //cmds.VV[item[8].split('/')[0]] = 1;
              set(cmds.VV, item[8].split('/')[0]);
            }       
          } else if(item[1].indexOf('NN') > -1){
            if(item[1] == 'NNG'){
              //cmds.NN[item[0]] = 1;
              set(cmds.NN, item[0]);
            } else if(item[6] == 'NNG'){
              //cmds.NN[item[8].split('/')[0]] = 1;
              set(cmds.NN, item[8].split('/')[0]);
            }       
          }
        }

        res(cmds);
      });
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



