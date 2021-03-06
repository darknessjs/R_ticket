var checkNumsLength=7;
var allNums=[];
var test=new Rticket.ticket();
var validNumsArr=[];
var allNumsLength=1;
var isContinue=false;
var getdataTimer=0;
var websocket=null;
var validNumsArrBk=[];
function connectWS(){
    websocket = new WebSocket("ws://43.239.159.229:8082/");
//    websocket = new WebSocket("ws://192.168.3.30:8082/");
    websocket.onopen = function(evt) {
        console.log("websocket success")
        handleCheckStart()
    };
    websocket.onclose = function(evt) {
        console.log("websocket fail")
    };
    websocket.onmessage = function(evt) {
        validNumsArr=validNumsArr.concat(JSON.parse(evt.data));
        if(validNumsArrBk.length>0){
            getdata();
            handleCheckStart();
            validNumsArrBk=validNumsArrBk.filter((num,i)=>{
                return i>3000;
            })
            allNumsLength=validNumsArrBk.length;
        }else{
            allNumsLength=(allNumsLength>3000?(allNumsLength-3000):0)
        }
    };
    websocket.onerror = function(evt) {
        console.log("websocket error",evt.data);
        isContinue=false;
        alert("服务器异常,请尝试刷新页面重新连接")
        $.get("http://43.239.159.229:8083/restartTicket")
    };
}
handleCheckStart=()=>{
    window.clearInterval(getdataTimer)
    getdataTimer=window.setInterval(()=>{
        getdata()
    },1000)
    let excludeNums=[];
    $('input[name="notInNums"]:checked').each(function(){
        excludeNums.push(parseInt($(this).val()));
    });
    $("input[name='notInNums_1']:checked").each(function(){
        let notInNumsValue=$(this).val().split("-");
        let notIncludeNum=notInNumsValue[1];
        for(let i=0;i<4;i++){
            let thisNum=(i*10)+parseInt(notIncludeNum);
            excludeNums=excludeNums.filter((num)=>{
                return num!=(thisNum)
            })
            thisNum!=0 && excludeNums.push(thisNum);
        }
        excludeNums=excludeNums.sort((a,b)=>{
            return a-b;
        })
    });
    let option={};
    option.excludeNums=excludeNums;
    console.log(excludeNums)
    console.log($("input[name='checkNumbers']:checked").val())
    if($("input[name='checkNumbers']:checked").val()){
        let valueArr=$("input[name='checkNumbers']:checked").val().split("-");
        option.continumCheckValue=parseInt(valueArr[0])
    }
    if($("input[name='oddNumbres']:checked").val()){
        option.oddNumbresCheckValue=parseInt($("input[name='oddNumbres']:checked").val())
    }
    if($("input[name='evenNumbres']:checked").val()){
        option.evenNumbresCheckValue=parseInt($("input[name='evenNumbres']:checked").val())
    }
    let checkNumsMap={};
    $('.notInNums:checked').each(function(){
        let notInNumsValue=$(this).val().split("-");
        let sameLength=notInNumsValue[0];
        if(parseInt(sameLength)===1){
            return true
        }
        if(!checkNumsMap[sameLength]){
            checkNumsMap[sameLength]=[]
        }
        let checkNums=notInNumsValue[1];
        checkNumsMap[sameLength].push(parseInt(checkNums));
    })
    for(let sameLength in checkNumsMap){
        option["laskNumberCheckNums"+sameLength]=checkNumsMap[sameLength];
    }
    $(".check-paragraph").each(function(){
        if($(this).val()!=""){
            let paragraphValue=$(this).attr("name").split("_");
            let startValue=parseInt(paragraphValue[1]);
            let paragraphLength=parseInt($(this).val());
            let startOrEndString=paragraphValue[2]
            option["paragraphCount"+startValue+startOrEndString]=paragraphLength
        }
    })
    if($("#largerThan").val()){
        option.max=parseInt($("#largerThan").val())
    }
    if($("#smallerThan").val()){
        option.min=parseInt($("#smallerThan").val())
    }
    if($("input[name='simpleNums']:checked").val()){
        let checkNumsArr=$("#inputSelectNumber").val().split(",");
        checkNumsArr=checkNumsArr.map((num)=>{
            return parseInt(num)
        });
        checkNumsArr.sort((a,b)=>{
            return b-a
        })
        option.includeNums=checkNumsArr;
        option.includeLength=parseInt($("input[name='simpleNums']:checked").val())
    }
    if($("#mustHaveCheckbox:checked").val()){
        option.isAtLeast=true
    }
    allNums=[];
    for(let i=1,j=0;i<38;i++){

        if(excludeNums.length>j && excludeNums[j]==i){
            j++;
        }else{
            allNums.push(i)
        }
    }



    if(validNumsArrBk.length>0){
        option.allNumsArray=validNumsArrBk.filter((num,i)=>{
            return i<3000;
        });
    }else{
        allNumsLength=1;
        for(let i=0;i<checkNumsLength && (allNums.length-i)>7;i++){
            allNumsLength=allNumsLength*(allNums.length-i)/(i+1);
        }
    }
    if($("input[name='checkNumers']:checked").val()){
        checkNumsLength=parseInt($("input[name='checkNumers']:checked").val());
        option.checkNumsLength=(checkNumsLength-1);
    }else{
        option.checkNumsLength=6;
    }

    websocket.send(JSON.stringify(option))


    console.log("allNums",allNums)
    console.log("allNumsLength",allNumsLength)
    console.log(option)


    let numsArr=[];
    for(let i=0;i<checkNumsLength;i++){
        numsArr[i]=allNums[allNums.length-(checkNumsLength*3)+i];
    }
    //mainLoop(numsArr,option);

}



function mainLoop(numsArr,option){
    allNumsLength--;
    if(!numsArr ||!isContinue){
    }else{
        window.setTimeout(function(){
            numsArr=getNestNumAndCheck(numsArr,option)
        },0)
    }
}
function getNestNumAndCheck(numsArr,option){
    let isValid=checkBySelect(numsArr,option);
    if(isValid) {
        validNumsArr.push(numsArr.concat([]))
    }
    numsArr=handleAddNumByIndex(numsArr,(checkNumsLength-1));
    mainLoop(numsArr,option );
}

checkBySelect=(numsArr,option)=>{
    test.setNumsArr(numsArr)
    let isValid=true;

    if(isValid &&  option.continumCheckValue){
        isValid=test.checkIsAnyContinuum(option.continumCheckValue,1)
    }

    if(isValid && option.oddNumbresCheckValue){
        isValid=test.checkOddNumbers(option.oddNumbresCheckValue);
    }
    if(isValid && option.evenNumbresCheckValue){
        isValid=test.checkEvenNumbers(option.evenNumbresCheckValue);
    }

    if(isValid && option.laskNumberCheckNums2) {
        isValid=test.checkLastNumber(2,option.laskNumberCheckNums2)
    }
    if(isValid && option.laskNumberCheckNums3) {
        isValid=test.checkLastNumber(2,option.laskNumberCheckNums3)
    }
    if(isValid && option.min){
        isValid=test.checkSumNumbers(option.min)
    }
    if(isValid && option.max){
        isValid=!test.checkSumNumbers(option.max)
    }

    if(isValid){
        $(".check-paragraph:checked").each(function(){
            let paragraphValue=$(this).val().split("-");
            let startValue=parseInt(paragraphValue[0]);
            let paragraphLength=parseInt(paragraphValue[1]);
            isValid=test.checkContinuumParagraph(startValue,paragraphLength)
            if(!isValid){
                return false;
            }
        })
    }

    if(isValid && option.includeLength){
        isValid=test.checkParagraph([{paragraphLength:option.includeLength,paragraphNums:option.includeNums,isInclude:true}])

        if(isValid && option.isAtLeast){
            isValid=test.checkIsHave(option.includeNums);
        }
    }
    return isValid;
}





handleAddNumByIndex=(numsArr,index)=>{
    if(numsArr[index]!=allNums[allNums.length-1]){
        numsArr[index]=getNextNum(numsArr[index]);
        return numsArr
    }else{
        if(index!=0){
            return nextArr(numsArr,index);
        }else{
            return false;
        }
    }
}

nextArr=(numsArr,index)=>{
    if(index==0){
        return false;
    }
    numsArr[index-1]=getNextNum(numsArr[index-1])
    for(let i=index;i<checkNumsLength;i++){
        numsArr[i]=getNextNum(numsArr[i-1]);
        if(!numsArr[i]){
            return nextArr(numsArr,index-1)
        }
    }
    return numsArr;
}

getNextNum=(num)=>{
    for(let i of allNums){
        if(i>num){
            return i;
        }
    }
    return false;
}
