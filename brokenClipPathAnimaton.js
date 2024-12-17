
function animatePie(oldVal, newVal, secs, radius, className){
    var totalIter = (Math.abs(newVal - oldVal)) / secs
    var iterTime = secs / totalIter;
    var dec = 1/totalIter;
    var objects = document.getElementsByClassName(className);
    var id = setInterval(anim, iterTime);
    anim();
    function anim(){
        if(Math.round(oldVal) == newVal){
            clearInterval(id);
            return;
        }
        oldVal -= dec;
        var pos = calculatePos(oldVal, radius);
        var path = makeClipPath(pos, oldVal);
        for(let i = 0; i < objects.length; i++){
            objects[i].style.clipPath = path;
        }
        console.log(getComputedStyle(objects[0].clipPath));
    }
}
function calculatePos(value, radius) {
    const deg = (value / 100) * 360;
    const radianFactor = Math.PI / 180;

    const x = Math.sin(deg * radianFactor) * radius;
    const y = Math.cos(deg * radianFactor) * radius;

    const xOffset = deg > 90 && deg <= 270 ? -1 : 1;
    const yOffset = deg > 180 ? -1 : 1;

    const adjustedX = (250 + xOffset * Math.abs(x)) / 5;
    const adjustedY = (250 + yOffset * Math.abs(y)) / 5;

    return [adjustedX, adjustedY];
}
function makeClipPath(pos, value){
    var originalPath = `polygon(${pos[0]}% ${pos[1]}%, 50% 0, 0 0`;
    if(value >= 25) originalPath += ",0 100%";
    if(value >= 50) originalPath += ", 100% 100%";
    if(value >= 75) originalPath += ",100% 0";
    originalPath += ", 50% 50%);";
    return originalPath;
}