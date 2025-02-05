var crntImageIndex = 0;
var timeoutID = undefined;
const slideInterval = 8000; //In ms
const fadeAnimDuration = 1000; //In ms
function changeSlide(direction, manualChange){
    if(manualChange) clearTimeout(timeoutID);
    document.getElementById('fade-screen').classList.add('fade'); //Starts fade animation
    setTimeout(() => {
        crntImageIndex = crntImageIndex + direction;
        if(crntImageIndex >= images.length) crntImageIndex = 0; //Set index upper bound
        else if(crntImageIndex < 0) crntImageIndex = images.length - 1; //Set index lower bound
        document.getElementById('slideshowImg').src = images[crntImageIndex]; //Change image
    }, (fadeAnimDuration / 2) - 30); //Changes image when window is white. -30ms to give the image time to render
    setTimeout(() => {
        document.getElementById('fade-screen').classList.remove('fade'); //So buttons can be used
        if(manualChange) autoChangeSlides(); //Restart autochange timer
    }, fadeAnimDuration);
}
function autoChangeSlides(){
    timeoutID = setTimeout(() => {
        changeSlide(1, false);
        autoChangeSlides();
    }, slideInterval);
}
autoChangeSlides();