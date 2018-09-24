//multiple - will replace existing
app.bind({
    //say hello
    hello: function(){ return 'world'; }
});

//single - append to existing object
app.config.searchSuffixes = app.add([
    {
        active: false,
        name: 'white_paper_pdf',
        value: ' white paper pdf'
    },
    {
        active: false,
        name: 'blockchain_whitepaper_com',
        value: ' "blockchain" "whitepaper" pdf ".com"'
    }, 
    {
        active: false,
        name: 'blockchain_whitepaper_io',
        value: ' "blockchain" "whitepaper" pdf ".io"'
    }, 
    {
        active: false,
        name: 'whitepaper_io',
        value: ' .io "whitepaper" pdf'
    }, 
    {
        active: false,
        name: 'address_ignore',
        value: ' +contact -property -mapquest -Google -Books -.gov -ups'
    }, 
    {
        active: false,
        name: 'leave_comment',
        value: ' “Leave A Comment”'
    }, 
    {
        active: false,
        name: 'email_publish',
        value: ' "E-Mail (will not be published)"'
    }, 
    {
        active: false,
        name: 'leave_reply',
        value: ' “Leave A Reply”'
    }, 
    {
        active: false,
        name: 'add_comment',
        value: ' “Add A Comment”'
    }
], app.config.searchSuffixes );

//set active config
app.setActiveConfig( 'searchSuffixes', 'white_paper_pdf' );