
chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
  if(typeof response == 'object' && response){
    console.log(response.farewell);
  }
});