//initialize
(function(name,init){
    //set init
    init = app.bind({
        name: name
    }, app.load() );
    //load app
    return init;
})('SearchEngineScraper',{});