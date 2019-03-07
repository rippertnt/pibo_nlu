var mecab = require('mecab-ffi');

let arr = [
  "	이름이 뭐야	",
  "	어디서 태어났니	",
  "	좋아하는 게 뭐야	",
  "	잘하는 게 뭐야	",
  "	좋아하는 게 뭐야	",
  "	싫어하는 음식이 뭐야	",
  "	제일 어려운게 뭐야	",
  "	어디로 가고 싶어	",
  "	왜 이리 말귀를 못 알아들어	",
  "	너는 누가 만들었어?	",
  "	아는게 뭐야	",
  "	너는 누구야?	",
  "	다녀왔습니다.	",
  "	시끄러워	",
  "	귀찮게 하지 마	",
  "	나 알아?	",
  "	심심해 재미있게 해줘	",
  "	뛰어	",
  "	너는 누구야?	",
  "	너 살아있어?	",
  "	무슨 생각 해?	",
  "	기분이 어때?	",
  "	잘 있었어?	",
  "	너나 좋아하지?	",
  "	너나 싫어하지	",
  "	내 기분이 어떻게	",
  "	뭘 봐	",
  "	나한테 궁금한 건 없어?	",
  "	아이보는 어떄?	",
  "	헤이카카오/헬로빅스비/오케이구글/시리야/클로바/아리야	",
  "	나 외로워	",
  "	나 배고프다	",
  "	내가 누구게?	"
]

/*
arr.forEach(async item =>{
  console.warn('>>>',item);
  const result = await parse(item);
  console.debug(result);
});
*/

//console.error('Finish!', arr.length);

function parse(text){
  return new Promise((res,rej)=>{
    mecab.parse(text, function(err, result) {
      //console.log(result);
      if(result){
        res(result);
      }

      if(err){
        rej(err);
      }
    });
  });
}

mecab.parse('하나 둘 일 이 1 2 백오십 150', function(err, result) {
  console.log(result);
});
