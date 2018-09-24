//-------------
// App Defaults
var app = {

    //set alert
    setAlert: function(request, sender, sendResponse) {
        console.log(request.message)
    },

    //set index
    setIndex: function(obj) {
        var c = 0;
        var l = 0;
        var m = 0;
        var p = 0;
        var d = 0;
        for (var o in obj) {
            l = JSON.stringify(obj[o]).length;
            m = Math.floor(Math.random() * l);
            p = Math.floor(Math.random() * (m + c));
            d = parseInt(Date.now().toString().substr(-7, 7));
            if (!obj[o].hasOwnProperty('index')) {
                obj[o].index = (c + l + m + p + d);
            }
            c++;
        }
        return obj;
    },

    //set setting
    setSetting: function(type, opts) {
        app[type + 'Setting'] = opts;
        app.storage.set(type + 'Setting', opts);
        app.apply( false, type + 'Setting' );
        return app;
    },

    //set state
    setState: function(name, group, type, item) {
        if (typeof item == 'object') {
            //check for name property
            if (app.has(item, 'name')) {
                app[type + name] = item;
                app[type + name].active = !app[type + name].active;
                app.filter(app[type + group], function(obj, index) {
                    if (obj.name == item.name) {
                        app[type + group][index] = app[type + name]
                    }
                });
                app.storage.set(type + name, app[type + name]);
                //apply changes
                app.apply( false, type + name );
                //apply scope
                if( name !== group ) {
                    app.apply( false, type + group );
                }
            } else {
                console.error('Missing "name" property in "item" on setState', item);
            }
        }
        return app;
    },

    //set service
    setService: function(type, item) {
        return app.setState('Service', 'Services', type, item)
    },

    //set service
    setSuffix: function(type, item) {
        return app.setState('Suffix', 'Suffixes', type, item)
    },

    //set service
    setCrawler: function(type, item) {
        return app.setState('Crawler', 'Crawlers', type, item)
    },

    //set service tab
    setResultSet: function(options, callback) {
        //get current results from remote server
        app.getCurrentResults(options).done(function(data) {
            app.currentResults = data;
            app.apply( false, 'currentResults' );
        });
        //get current service tab
        if( typeof callback !== 'function' ) {
            app.currentServiceTab = app.getCurrentServiceTab(options);
            app.apply( false, 'currentServiceTab' );
        } else {
            callback( options );
        }

        return options;
    },

    //set service tabs
    setServiceTab: function(opts) {
        //check if service tab exist or set new
        if (!app.isFound('serviceTab', opts.service.name)) {
            app.serviceTab[opts.service] = [];
        }
        //find a match in the service tab by suffix and text
        var match = app.filter(app.serviceTab[opts.service.name], function(data) {
            return (data.suffix.value == opts.suffix.value && data.service.text == opts.service.text)
        });
        //set service tab name;
        if (opts.hasOwnProperty('name')) {
            debugger;
        }
        //add if not already exists
        if (match.length == 0) {
            app.serviceTab[opts.service.name].push(opts);
        }
        //save data to local storage
        app.storage.set('serviceTab', app.serviceTab);
    },

    //get service tab from storage
    getServiceTab: function() {
        return app.storage.get('serviceTab') || {};
    },

    //get current service tab
    getCurrentServiceTab: function(opts) {
        var tab = {};
        var tabs = [];
        var found = [];
        var options = [];
        var results = [];
        var output = {};
        //get service tab
        app.serviceTab = app.getServiceTab();
        //update service tab
        if ( app.isFound('serviceTab', opts.service.name) ) {
            //get tabs for service
            tabs = app.serviceTab[opts.service.name];
            //check for tabs
            if ( tabs.length > 0 ) {
                //get found
                found = app.filter(tabs, function(obj) {
                    return (obj.service.text == opts.service.text && obj.suffix.value == opts.suffix.value)
                });
                //set tab
                tab = (found && found.length > 0) ? found[0] : tabs[0];
            }
        }
        //set current service tab
        app.currentServiceTab = tab;
        //set text
        app.searchService.text = tab.text;
        //reset search results
        app.searchResults[ opts.service.name ] = [];
        //set search history
        app.searchHistory = app.serviceTab[ opts.service.name ];
        //check options
        app.forEach( app.searchCollection, function( collection, index ){
            //check for service
            if( collection.message.options.service && opts.service ) {
                //check for message
                if( collection.message.options.service.name === opts.service.name ) {
                    //set options
                    options = collection.message.options;
                    //set results
                    results = collection.message.results;
                    //set output
                    output = {
                        results: results,
                        service: options.service,
                        suffix: options.suffix,
                        updated: Date.now(),
                        created: Date.now()
                    };
                    //set results
                    app.searchResults[ opts.service.name ].push( output );
                    //set current results
                    app.getCurrentResults( output );
                }
            }
        });
        //set scope
        app.apply( false, 'currentServiceTab' );
        app.apply( false, 'searchService' );
        app.apply( false, 'searchHistory' );
        app.apply( false, 'searchResults' );
        app.apply( false, 'serviceTab' );        
        //return tab
        return tab;
    },

    //log messages
    logMessage: function(request, sender, sendResponse) {
        //push messsage
        app.messages.push({
            message: request,
            sender: sender
        });
        //save message
        app.storage.set('appMessages', app.messages);
        //send response
        sendResponse({
            action: 'setAlert',
            message: 'Message logged on ' + Date.now()
        });
    },

    //get search details from page
    listenOn: function(page) {
        //get any messages front content script
        app.tab.getMessage(function(request, sender, sendResponse) {
            //log all messages
            app.logMessage(request, sender, sendResponse);
            //execute a function
            if (typeof app[request.target] == 'function') {
                app[request.target](request, sender, sendResponse);
            }
            //return a property
            else if (request.action == 'getProperty' && app.hasOwnProperty(request.target)) {
                sendResponse(app[request.target]);
            }
        })
    },

    //call function by name with arguments
    callFunction: function( name, args ) {
        //set results
        var results = false;
        //check if app has name
        if( app.has( app, name ) && 
            typeof app[ name ] === 'function' 
        ) {
            //check for arguments
            if( args && args.length > 0 ) {
                //set length of arguments
                var len = args.length;
                //check if args is greater than 1
                if( len === 1 ) {
                    results = app[ name ]( args[0] );
                }
                if( len === 2 ) {
                    results = app[ name ]( args[0], args[1] );
                }
                if( len === 3 ) {
                    results = app[ name ]( args[0], args[1], args[2] );
                }
                if( len === 4 ) {
                    results = app[ name ]( args[0], args[1], args[2], args[3] );
                }
            } else {
                results = app[ name ]();
            }
        }
        return results;
    },

    //get search results
    getSearch: function(request, sender, sendResponse) {
        //set options shorthand
        var opts = request.options;
        //take action
        switch (request.action) {
            //set results
            case 'setResults':
                app.setResults({
                    service: opts.service,
                    suffix: opts.suffix,
                    results: request.results
                }, sendResponse);
            break;
            case 'waitResults':
                app.waitResults( opts, request.results.wait );
            break;
            case 'doneSearching':
                app.doneSearching( request, sendResponse);
            break;
        }
    },

    //inject search on page and listen for changes
    setSearch: function(text) {
        if (app.didSearch) {
            return false;
        }
        if (text && text != undefined) {
            //set search suffix if none exist
            if (!app.searchSuffix) {
                app.setSuffix('search', 0);
            }
            //set search service if none exist
            if (!app.searchService) {
                app.setService('search', 0);
            }
            //set search text
            app.searchService.text = text;
            //get search service
            var s = app.searchService;
            //get search suffix
            var f = app.searchSuffix;
            //check for value
            if (s.text != '') {
                //set service tab
                if (!app.isFound('serviceTab', s.name)) {
                    this.serviceTab[s.name] = [];
                }
                //save to storage
                app.setService('search', app.searchService);
                //set service tab
                app.setServiceTab(app.setIndex([{
                    total: 0,
                    text: s.text,
                    service: {
                        name: s.name,
                        text: s.text
                    },
                    suffix: {
                        name: f.name,
                        value: f.value
                    },
                    updated: Date.now()
                }][0]));
                //set searching
                app.searching = true;
                //set scope
                app.apply( false, 'searching' );
                //set is search
                app.didSearch = true;
                //set app processing
                app.processing = true;
                //set scope
                app.apply( false, 'didSearch' );
                //open page
                jQuery.when(this.openPage()).done(function(page) {
                    //get search results 
                    app.listenOn(page);
                    //turn searching off
                    app.didSearch = false;
                    //set scipe
                    app.apply( false, 'didSearch' );
                });
            }
        }
        return app;
    },

    //reset local storage
    setReset: function() {
        //clear local 
        localStorage.clear();
        //clear storage
        this.tryCatch(function(){
            chrome.storage.local.clear();
        }, function(){
            localStorage.clear();
        });
        //reset search text
        app.searchService.text = '';
        //set scope
        app.apply( false, 'searchService' );
        //set message
        app.notify('All settings have been reset!');
        //reload
        window.setTimeout(function(){
            window.location.reload();
        },3000);
    },

    //set results on app from saved resultset
    setResults: function(opts, callback) {
        //set default message
        var message = '';
        //set deferred
        var defer = app.deferred();
        //get results from server
        app.getResults(opts.service.name).done(function(data) {
            //check for data
            data = ( typeof data === 'object' ) ? data : [];
            //set options
            var options = app.setResultSet({
                service: opts.service,
                suffix: opts.suffix
            });
            //find existing
            var index = 0;
            var found = app.filter(data, function(obj, idx) {
                if (opts.service.text == obj.service.text &&
                    opts.suffix.value == obj.suffix.value
                ) {
                    index = idx;
                    return true;
                } else {
                    return false
                }
            });
            //set default search result data
            if (data.length > 0) {
                //get results
                app.searchResults[opts.service.name] = data;
                //set scope
                app.apply( false, 'searchResults' );
                //set result set after failed attempt
                if (opts.service.text == '') {
                    //set result set from first data set 
                    app.setResultSet(data[0]);
                }
            }
            //check if we have results
            if (opts.results.length > 0) {
                //update existing
                if (found.length > 0) {
                    for (var o in opts.results) {
                        data[index].results.push(opts.results[o]);
                        data[index].updated = Date.now();
                    }
                }
                //add new
                else {
                    data.push({
                        results: opts.results,
                        service: opts.service,
                        suffix: opts.suffix,
                        updated: Date.now(),
                        created: Date.now()
                    });
                    //set index
                    index = data.length - 1;
                    //set result set
                    if( data.length == 1 ) {
                        app.setResultSet(data[0]);
                    }
                }
                //set search results
                app.searchResults[opts.service.name] = data;
                //set scope
                app.apply( false, 'searchResults' );
                //post data to server if allowed
                if( app.ajaxSettings.post.url !== '' ) {
                    //load ajax and post
                    app.ajax('POST', app.ajaxSettings.post.url, JSON.stringify(data),
                        //set headers
                        app.ajaxSettings.post.headers,
                        //success
                        ( app.ajaxSettings.get.success || function(result) {
                            //set result
                            if (result) {
                                //set message
                                message = 'Search result saved!'
                                    //set as saved
                                console.log('Saved results', result);
                                //set results to local storage
                                app.storage.set(opts.service.name + 'Results', result);
                            } else {
                                //set message
                                message = 'Search result not saved!'
                            }
                            //set ersult
                            defer.resolve(result);
                        } ),
                        //error
                        ( app.ajaxSettings.get.failure || function(result) {
                            //set message
                            message = 'Saving returned errors! ' + result;
                            //set console 
                            console.error('Saved results', result);
                            //set ersult
                            defer.reject(result);
                        } ),
                        //always
                        ( app.ajaxSettings.get.always || function( obj ){
                            console.log('Ajax: '+obj);
                        } )
                    );
                }
                defer.resolve([]);
                //done or fial, always do this
                defer.always(function() {
                    //set callback
                    if (typeof callback == 'function') {
                        callback({
                            target: 'setAlert',
                            action: 'animate',
                            message: message,
                            options: options,
                            results: data
                        });
                    }
                })
            }
        });
    },

    //wait for results to complete and execute
    waitResults: function( opts, wait ){
        //set message
        app.notify('Waiting for '+(wait/1000)+' seconds..');   
        //turn off temporarily
        if( opts.name === 'runBatchOperation' ) {
            //turn off started
            app.batchOperation.started = false;
            //save batch operation to local storage
            app.storage.set( 'batchOperation', app.batchOperation );
            //reload page
            app.refreshPage('Waiting for '+(wait/1000)+' seconds.. (Reloaded Page)');
        }
        //call function after some time
        window.setTimeout( function() {
            app.callFunction( opts.name, opts.args );
        }, wait );
    },

    //save results
    saveResults: function() {
        //check for results
        if( app.results && app.results.length > 0 ) {
            //check for window object 'all results'
            var allResults = localStorage.getItem('allResults')||[];
            if( typeof allResults !== 'object' ) {
                allResults = JSON.parse( allResults );
            }
            //set temp text
            var text='';
            //loop in each results
            for(var a in app.results) {
                //loop in each title of results
                for(var r in app.results[a].title) {
                    //set text
                    text = [
                        ( app.results[a].title[r] + '').split('|').join(' '),
                        ( app.results[a].descr[r] + '').split('|').join(' '),
                        ( app.results[a].url[r] + '').split('|').join(' ')
                    ].join('|').split(',').join(' ');
                    //check for duplicates
                    if( allResults.indexOf( text ) === -1 ) {
                        allResults.push( text );
                    }
                }
            }
            //set all results
            localStorage.setItem('allResults', JSON.stringify(allResults) );
        }
    },

    //send results to app from web page
    listResults: function() {
        //save results
        app.saveResults();
        //set ended
        app.options.ended = Date.now();
        //send message to extension
        app.tab.setMessage({
            target: 'getSearch',
            action: 'setResults',
            options: app.options,
            results: app.results
        }, function(resp) {
            console.log('getSearch > setResults > setMessage Response: ', resp);
        });
    },

    //set results as done
    doneResults: function( results ){
        //check if not paused
        if( app.pause ) {
            console.log('getSearch > doneSearching > App Paused ', results);
        } else {
            // debugger;
            //set ended
            app.options.ended = Date.now();
            //send message to extension
            app.tab.setMessage({
                target: 'getSearch',
                action: 'doneSearching',
                options: app.options,
                results: app.results,
                exports: results
            }, function(resp) {
                console.log('getSearch > doneSearching > setMessage Response: ', resp);
            });
        }
    },

    //map results
    mapResults: function(results, all) {
        var unique = {
            url: []
        };
        var res = [],
            oth = [];
        var list = ['pagify', 'repeat', 'terms', 'src'];
        //look in each results
        app.forEach(results, function(result) {
            //look in each result
            app.forEach(result, function(item) {
                //loop in each item url
                app.forEach(item.url, function(url, index) {
                    //check for uniques
                    if (unique.url.indexOf(url) == -1) {
                        //add to urls
                        unique.url.push(url);
                        //add to map
                        res.push({
                            title: item.title[index],
                            descr: item.descr[index],
                            url: url
                        });
                    }
                });
                //loop in each item url
                app.forEach(list, function(value) {
                    //check for item property
                    if (app.has(item, value)) {
                        //set unique default
                        if (!app.has(unique, value)) {
                            unique[value] = [];
                        }
                        //check for object
                        if (typeof item[value] != 'object') {
                            item[value] = [item[value]];
                        }
                        //loop through item at property
                        app.forEach(item[value], function(data) {
                            //check for uniques
                            if (unique[value].indexOf(data) == -1) {
                                //add to urls
                                unique[value].push(data);
                            }
                        });
                    }
                })
            });
        });

        //get all propeties
        if (all) {
            unique.results = res;
            unique.mapped = true;
            return unique;
        }
        //jst get results
        else {
            return res;
        }
    },

    //get current results
    getCurrentResults: function(obj) {
        //set output
        var output = [];
        //set found
        var found = [];
        //set defer
        var defer = app.deferred();
        //get results from server
        app.getResults(obj.service.name).done(function(data) {
            //check for data
            if( data.length === 0 ) {
                //check in object
                if( app.has( obj, 'results') ) {
                    //set results
                    found = obj.results;
                    //look in each result
                    app.forEach( obj.results, function( item ){
                        //check for message
                        if( app.has( item, 'message' ) && 
                            app.has( item.message, 'results' ) 
                        ) {
                            found = item.message.results;
                        }
                    });
                    //check results
                    if (found.length > 0) {
                        output = app.mapResults([found]);
                    }
                }
            } else {
                //get results
                found = app.filter(data, function(opts) {
                    return (opts.service.text == obj.service.text && opts.suffix.value == obj.suffix.value)
                });
                //check results
                if (found.length > 0) {
                    output = app.mapResults(found);
                }
            }
            //resolve
            defer.resolve(output);
        });
        return defer;
    },

    //get results from storage
    getResults: function(name) {
        //set output
        var output = [{
            results: [],
            source: 'local',
            service: app.searchService,
            suffix: app.searchSuffix,
            updated: Date.now(),
            created: Date.now()
        }];
        //set deferred 
        var defer = app.deferred();
        //set name from search service
        name = name ? name : app.searchService.name;
        //get saved query from storage
        var saved = true;
        //TOO LARGE FOR STORAGE
        //saved = app.storage.get(name + 'Results');
        //check for query
        if (saved) {
            //get saved data if any and save to url if provided
            if (app.has(saved, 'saved') ) {
                //post data to server if allowed
                if( app.ajaxSettings.get.url !== '' ) {
                    //load ajax and post
                    app.ajax('GET', app.ajaxSettings.get.url, JSON.stringify(data),
                        //set headers
                        app.ajaxSettings.get.headers,
                        //success
                        ( app.ajaxSettings.get.success || function(result) {
                            //set result
                            if (result) {
                                //set as saved
                                console.log('Retrieved server results passed', result);
                                //set source
                                result.source = 'server';
                                //set results
                                defer.resolve([result]);
                            } else {
                                defer.resolve(output);
                            }
                        } ),
                        //error
                        ( app.ajaxSettings.get.failure || function(result) {
                            //set console 
                            console.error('Retrieved server results failed', result);
                            //set result as local
                            result.source = 'local';
                            //set ersult
                            defer.reject([result]);
                        } ),
                        //always
                        ( app.ajaxSettings.get.always || function( obj ){
                            console.log('Ajax: '+obj);
                        } )
                    );
                }
            } else {
                //resolve
                defer.resolve([]);
            }
        } else {
            //resolve
            defer.resolve(output);
        }
        //return 
        return defer;
    },

    //scrape results on web page
    scrapeResults: function(doc) {
        //check app opitons for service
        var svc = app.options.service;
        //set app options
        if( !svc || !svc.resultLink ) {
            return false;
        }
        var lnk = app.query(svc.resultLink, doc);
        var dsc = app.query(svc.resultDesc, doc);
        var pgf = app.query(svc.pagifyLink, doc);
        var oth = app.query(svc.otherTerms, doc);
        var rep = app.query(svc.repeatLink, doc);
        var out = {
            src: doc.location.href,
            url: app.findKey(lnk, 'href'),
            title: app.findKey(lnk, 'innerText'),
            descr: app.findKey(dsc, 'innerText'),
            terms: app.findKey(oth, 'innerText'),
            pagify: app.unique(app.findKey(pgf, 'href')),
            repeat: app.unique(app.findKey(rep, 'href'))
        };
        return out;
    },

    //export results
    exportResults: function( callback ){
        //set variables
        var results = [];
        var title = '';
        var descr = '';
        //check for results
        if( app.results.length > 0 ) {
            //loop in results
            app.forEach( app.results, function( item, idx ){
                //loop in each url
                app.forEach( item.url, function( url, index ){
                    cures = app.results[idx];
                    title = cures['title'][index];
                    descr = cures['descr'][index];
                    results.push([
                        '"' + title + '"', 
                        '"' + descr + '"',
                        '"' + url + '"'
                    ].join(','))
                });
            });
            //go to the next page
            var searchStr = app.clean( app.options.service.text );
            //Set csv value
            var csvContent = "data:text/csv;charset=utf-8," + results.join("\r\n");
            //download csv
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", searchStr+ "_" + results.length + "_" + Date.now() + ".csv");
            document.body.appendChild(link);
            link.click();
            //turn off export
            app.export = false;
            //set callback
            if( typeof callback === 'function' ) {
                callback( results );
            }
            //TEMPORARY FIX FOR MAXIMUM STORAGE BUG
            localStorage.removeItem('allResults');
        } else {
            //set debugger;
            console.error('No results to export...');
            //check if on robot page
            if( document.body.innerText.indexOf('not a robot') !== -1 ) {
                debugger;
            }
        }
    },

    //pause scraper for some time then run batch 
    pauseScraper: function( name, wait, args, callback ) {
        //set variables
        var functionName = name;
        var functionArgs = args;
        var totalWaitTime = wait;
        //send message to extension
        app.tab.setMessage({
            target: 'getSearch',
            action: 'waitResults',
            options: { 
                name: functionName, 
                args: functionArgs 
            },
            results: { 
                wait: totalWaitTime 
            }
        }, function(resp) {
            //set console log
            console.log('getSearch > waitResults', resp);
            //check for callback
            if( typeof callback === 'function' ) {
                callback( resp );
            }
        });
    },

    //set end scraper
    endScraper: function( interval ) {
       //stop looking
        window.clearInterval( interval );
        //export csv
        app.exportResults(function( results ){
            //set as done
            if( app.removeFrames() ) {
                //set done results
                app.doneResults( results );
            } else {
                //pause the app
                app.pause = true;
                //set console error
                console.error('%cScraper could not remove iframes..','color:red;font-weight:bold;font-size:14pt;');
                //reload page
                window.setTimeout(function(){
                    //wait for some time then try again
                    app.pauseScraper( 'runBatchOperation', 30000, [ true ], function( resp ){
                        console.log('%cApplication will reload after 30 seconds..','color:green;font-weight:bold;font-size:14pt;');
                        console.log( resp );
                        //reload the application
                        app.reloadApplication( true );
                    } );
                },3000);
            }
        });
    },

    //set scraper code on app
    setScraper: function() {
        //set listener
        app.listenOn(document);
        //get defuaults
        var dfr = app.deferred();
        var svc = app.options.service;
        var sfx = app.findKey(app.searchSuffixes, 'value');
        var sch = '"' + svc.text + '" ' + svc.suffix;
        var pgf = [];
        var res = [];
        var ovl = {};
        var doc = document;
        var usp = [];
        var lnk = '';
        var pgn = '';
        var sze = 0;
        var rsz = 0;
        var sat = 0;
        var idx = 0;
        var bid = false;
        var tid = false;
        var prt = false;
        var txt = app.query(svc.searchText, doc)[0];

        //set body style
        app.gettag('body')[0].style.backgroundColor = 'rgba(193,193,193,0.65)';
        //get first scraped results
        res = app.scrapeResults(document);
        //check for results
        if( res ) {
            debugger;
            //open iframe and click button
            if (svc.clickButton || ( txt && txt.value != sch ) ) {
                //check for results page
                if (res.src) {
                    //load frame and decorate it
                    app.iframes[0] = app.decorate(app.iframe(res.src));
                    //set frame loaded
                    app.iframes[0].loaded = 0;
                    //wait for frame to load
                    app.iframes[0].onload = function(elm) {
                        //attempt to get target
                        try {
                            //get iframe document
                            doc = elm.target.contentWindow.document;
                            //get results if any
                            res = app.scrapeResults(doc);
                            //set iframe index
                            idx = 0;
                            //check for results if any
                            if (app.iframes[0].loaded == 0) {
                                //set overlay message
                                app.digress(0, elm.target.id, res);
                                //set click submit
                                app.clickSubmit( elm, idx, sch );
                            }
                            //return if iframe loaded
                            else if (app.iframes[0].loaded == 1) {
                                //set decorated message
                                app.digress(1, elm.target.id, res);
                                //check for results
                                if (res.url.length > 0) {
                                    //push results
                                    app.results.push(res);
                                }
                                //set overlay
                                dfr.resolve(res);
                            }
                            //list results
                            else {
                                app.listResults();
                            }
                        } catch(e) {
                            //set console error
                            console.error('Access to iframe restricted..', e );
                            //reload page
                            window.setTimeout(function(){
                                //wait for some time then try again
                                app.pauseScraper( 'runBatchOperation', 30000, [ true ], function( resp ){
                                    console.log('%cApplication will reload after 30 seconds..','color:green;font-weight:bold;font-size:14pt;');
                                    console.log( resp );
                                    //reload the application
                                    app.reloadApplication( true );
                                } );
                            },3000);
                        }
                    }
                }
            }
            //or just resolve since we are on the right page
            else if (res.pagify.length > 0 || !svc.pagifyLink) {
                dfr.resolve(res);
            }
        } else {
            //set log
            console.error('%cScraper missing app service..','color:red;font-weight:bold;font-size:14pt;');
        }
        //wait until done 
        dfr.done(function(result) {

            //--------------
            //reset results
            if (result.url.length > 0) {
                res = result;
                sat = 1;
            }

            //----------------------
            //add pagify to results
            if (res.src && res.pagify.indexOf(res.src) == -1) { 
                res.pagify.unshift(res.src);
            }

            //-------------------
            //spawn more results
            if (app.spawnResults && svc.spawnCount && svc.pageStart) {
                //generate pagify url query
                if (res.src.indexOf(svc.pageStart) != -1) {
                    usp = res.src.split(svc.pageStart);
                    usp[0] = usp[0] + svc.pageStart;
                    usp[1] = '&' + usp[1].split('&')[1];
                } else {
                    usp = [
                        res.src + svc.pageStart,
                        (svc.pageNumber) ? svc.pageNumber + svc.resultSize : ''
                    ];
                }
                //look through pages and add links
                for (var x = 0; x < svc.spawnCount; x++) {
                    sze = (svc.resultSize * (x + 1)) + svc.resultAdd;
                    lnk = usp[0] + sze + usp[1];
                    prt = svc.pageStart + sze;
                    if (res.pagify.indexOf(lnk) == -1 &&
                        !app.hasInArray(res.pagify, prt)
                    ) {
                        res.pagify.unshift(lnk);
                    }
                }
            }
            //----------
            //set pagify
            rsz = svc.resultSize;
            pgn = svc.pageNumber;
            pgf = app.unique(res.pagify);

            //-––––---------------
            //spawn sorted results
            if (app.spawnResults ) {
                pgf = app.sortUrl(pgf,res.src,rsz,pgn);
            }

            //-----------
            //set iframes
            if( !app.iframes ) {
                app.iframes = [];
            }

            //-------------
            //build iframes
            if (pgf.length > 0) {
                //set variables
                var n = 0;
                var m = 3;
                var w = 0;
                //30 sec wait
                var s = 10;
                //5 duplicates
                var u = 5;
                var x = sat;
                var y = pgf.length;
                var up = [ pgf[0] ];
                //set interval on
                var itv = window.setInterval(function() {
                    //check if no iframe 
                    if( !app.has( app.iframes, x ) && x !== y ) {
                        //check if not already used
                        if( up.indexOf( pgf[x] ) === -1 ) {
                            //add to pagify
                            up.push( pgf[x] );
                            //create iframe and decorate it
                            app.iframes[x] = app.decorate(app.iframe(pgf[x]));
                            //set frame loaded
                            app.iframes[x].loaded = 0;
                            //scrape results on load
                            app.iframes[x].onload = function(elm) {
                                //get frame document
                                var dcm = elm.target.contentWindow.document;
                                //check for iframe
                                if( app.iframes[x] ) {
                                    //check if loaded
                                    if ( app.iframes[x].loaded == 0) {
                                        //set click submit
                                        app.clickSubmit( elm, x, sch );
                                    } 
                                    //check if iframe loaded
                                    if ( app.iframes[x].loaded == 1) {
                                        //get results
                                        var rst = app.scrapeResults(dcm);
                                        //get target id
                                        var tid = elm.target.id
                                        //set default dpulicate
                                        var dup = 0;
                                        //set results
                                        var apr = app.results;
                                        //set decorated message
                                        app.digress(1, tid, rst);

                                        //check for results  
                                        if (rst.url.length > 0) {
                                            //check for duplicate results
                                            for( var a in apr ) {
                                                //loop in results
                                                for( var r in rst.url ) {
                                                    //check if any match
                                                    if( apr[a].url == rst.url[r] ) {
                                                        dup++;
                                                    }
                                                }
                                            }
                                            //check dupes
                                            if( dup < u ) {
                                                //push results
                                                app.results.push(rst);
                                                //save results
                                                app.listResults();
                                            }
                                        } else {
                                            n++;
                                        }
                                        //check for pagify
                                        if (res.pagify.length > 0) {
                                            //check length of pagify vs result pagify
                                            if( pgf.length > rst.pagify.length && 
                                                //second iframe
                                                x === 1 
                                            ) {
                                                pgf[0] = rst.pagify[0];
                                            }
                                            //set pagify
                                            pgf = app.add(pgf, rst.pagify, true);
                                            pgf = app.unique( pgf );
                                        }
                                        
                                        //check if reached end of pagify
                                        if ( ( x >= pgf.length && pgf.length > 0 ) || 
                                             //check if no page results for most
                                            ( n == m ) || 
                                            //check if maximum duplicates met
                                            ( dup >= u ) 
                                        ) {
                                            app.export = true;
                                        }

                                        //set as export
                                        if( app.export ) {
                                            //end scraper
                                            app.endScraper( itv );
                                        } else {
                                            x++;
                                        }
                                    }
                                }
                            };
                        } else if( pgf.length > 0 ) {
                            app.endScraper( itv );
                        } else {
                            console.error('No Pagify URLs ')
                        }
                    } else {
                        //waiting
                        w++;
                        //nothing left
                        if( w == s ||  x === y ) {
                            //end scraper
                            app.endScraper( itv );
                        }
                    }
                }, app.random(7,3) * 1234 );
            }
        });
    },

    //submit search
    clickSubmit: function( elm, idx, sch ){
        //set field ids
        var bid = app.name + 'SearchBtn';
        var tid = app.name + 'SearchTxt';
        var svc = app.options.service;
        var doc = elm.target.contentWindow.document;
        //check for results if any
        if (app.iframes[idx] && app.iframes[idx].loaded == 0) {
            //get search text and button
            try{
                app.query(svc.searchText, doc)[0].value = sch;
                try{
                    app.query(svc.searchFrom, doc)[0].submit();
                }catch(e){}
                try{
                    app.query(svc.searchButton, doc)[0].id = bid;
                    app.click(app.getid(bid, doc));
                }catch(e){}
            }catch(e){}
            //set number of times loaded
            app.iframes[idx].loaded++;
            //set return
            return true;
        } else {
            return false;
        }
    },

    //remove iframes
    removeFrames: function(){
        //set prefix
        var removed = false;
        var element = false;
        var prefix = 'app-iframe-';
        var section = ['','-overlay','-header','-footer'];
        //checkfir iframes
        if( app.iframes.length > 0 ) {
            //look in each 
            for(var idx in app.iframes) {
                //set section
                for( var x in section ) {
                    //select element 
                    element = app.query('#'+prefix+idx+section[x]);
                    //check if element exists
                    if( element && element.length > 0 ) {
                        //remove element
                        element[0].remove();
                        //set remved
                        removed = true;
                    }
                }
            }
        }
        return removed;
    },

    //open settings
    openSettings: function(setting) {
        if (typeof setting.callback == 'function') {
            setting.callback();
        }
        setting.active = true;
        return setting;
    },

    //edit services
    editServices: function() {},

    //edit suffixes
    editSuffixes: function() {},

    //set timer up to second
    setTimer: function(count, callback) {
        var inc = count;
        var span = $('#timer-message span');
        var timer = setInterval(function() {
            app.timer = (inc / 1000);
            span.html(app.timer);
            if (inc <= 0) {
                app.stopTimer(timer);
                if (typeof callback == 'function') {
                    callback();
                }
            } else {
                inc -= 1000;
            }
        }, 1000);
        app.timer = (count / 1000);
        return timer;
    },

    //stop timer
    stopTimer: function(timer) {
        clearInterval(timer);
        app.timer = 0;
    },

    //set byte size 
    byteSize: function(a,b) {
        if(0==a)return"0 Bytes";
        var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));
        return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f];
    },

    //get extension information
    getExtensionInfo: function(callback) {
        var defer = jQuery.Deferred();
        chrome.management.getSelf(function(info) {
            if (typeof callback == 'function') {
                callback(info);
            }
            defer.resolve(info);
        });
        return defer;
    },

    //get platform information
    getPlatformInfo: function(callback) {
        var defer = jQuery.Deferred();
        chrome.runtime.getPlatformInfo(function(info) {
            defer.resolve(info);
            if (typeof callback == 'function') {
                callback(info);
            }
        });
        return defer;
    },

    //get tab information
    getTabInfo: function() {
        var defer = jQuery.Deferred();
        chrome.tabs.getCurrent(function(tab) {
            if (typeof callback == 'function') {
                callback(tab);
            }
            defer.resolve(tab);
        });
        return defer;
    },

    //open options
    openOptionsPage: function() {
        // Open options page
        if (chrome.runtime.openOptionsPage) {
            // New way to open options pages, if supported (Chrome 42+).
            chrome.runtime.openOptionsPage(function() {

            });
        } else {
            // Reasonable fallback.
            window.open(chrome.runtime.getURL('options.html'));
        }
    },

    //get background
    openBackgroundPage: function() {
        // Open options page
        if (chrome.runtime.getBackgroundPage) {
            // New way to open options pages, if supported (Chrome 42+).
            chrome.runtime.getBackgroundPage(function(backgroundPage) {
                //backgroundPage.document.body
            });
        } else {
            // Reasonable fallback.
            window.open(chrome.runtime.getURL('options.html'));
        }
    },

    //set file action
    setFileAction: function( action ) {
        //get file
        var file = app.activeFile;
        //set file by type
        app.setFileByType( file, function( data ){
            //log console
            console.log(" Action: "+action, data );
            //back process
            if( action === 'process' ) {
                //set message
                app.notify("Batch Processing for "+file.name+" started ...");
                //set tab
                app.setTab('main','process');
                //set batch process
                app.setBatchProcess( file.name, data );
            }
            //post comment
            if( action === 'comment' ) {
                //set message
                app.notify("Comment posting feature is under development ...");
                //set tab
                app.setTab('main','comment');
            }
        });
    },

    //set active file
    setActiveFile: function( file ) {
        //set active viewd file
        app.activeFile = file;
        //set scope
        app.apply( false, 'activeFile' );
        //set file 
        app.fileReader = file.value;
        //set scope
        app.apply( false, 'fileReader' );
    },

    //add uploaded file to uploads
    addUploadFile: function( attr, value ) {
        //set defaults
        var found = false;
        //loop in uploads
        app.forEach( app.uploadedFiles, function( item ){
            if( item.name == attr.name ) {
                found = item;
            }
        });
        //add to uploaded files
        if( !found ) {
            //set file
            attr.value = value;
            //add to uploaded files
            app.uploadedFiles.push(attr);
            //set scope
            app.apply( false, 'uploadedFiles' );
            //save data to local storage
            app.storage.set('uploadedFiles', app.uploadedFiles);
            //set message
            app.notify('File "'+attr.name+'" uploaded successfully!');
            //set uploading
            app.uploading = false;
            //set scope
            app.apply( false, 'uploading' );
            //set found 
            found = attr;
            //reload window
            window.setTimeout(function(){
                window.location.reload();
            },3000);
        } else {
            app.notify('File "'+attr.name+'" already uploaded!');
        }
        return found;
    },

    //get file reader
    getFileReader: function(){
        return app.fileReader;
    },

    //set upload callback
    uploadCallback: function( data ){

    },
    
    //set file by type
    setFileByType: function( file, callback ) {
        //get file type
        var type = file.type.split('/')[1];
        //set results
        var results = false;
        //check if csv
        if( type === 'csv' ) {
            app.importCSV( true );
            results = app.uploadCallback( file )
        }
        //check if csv
        if( type === 'json' ) {
            app.importJSON( true );
            results = app.uploadCallback( file )
        }
        //check for callback
        if( typeof callback === 'function' ) {
            callback( results );
        }
    },

    //set upload progress
    uploadProgress: function( loaded ) {
        // Increase the prog bar length
        $('#uploadLoading > div').css('width', (loaded * 400) + "px");
        $('#uploadLoading > div span').html( (loaded * 400) + ' % Complete' );
    },

    //upload file
    uploadFile: function(){
        //change  tab
        app.setTab('main','upload');
        //set file
        var name = $('#uploadFile').val();
        var file = $("#uploadFile")[0].files[0];
        //check for file
        if (file) {
            //set data
            var data = {};
            //loop in file
            for(var f in file ){
                if( typeof file[f] !== 'function' ) {
                    data[f] = file[f];
                }
            }
            //set file by type
            app.setFileByType(data);
            //set uploading
            app.uploading = true;
            //set scope
            app.apply( false, 'uploading' );
            //set file reader
            var reader = new FileReader();
            //get as urf
            reader.readAsText(file, "UTF-8");
            //on load
            reader.onload = function (evt) {
                //read file contents
                app.fileReader = evt.target.result;
                //set scope
                app.apply( false, 'fileReader' );
                //add upload file
                var uploaded = app.addUploadFile( data, app.fileReader );
                //set upload callback
                app.uploadCallback( uploaded );
                //wait a second
                app.setActiveFile( uploaded );
                //set value
                $('#uploadFile').val('');
                //set upload progress
                app.uploadProgress( 1 );
                //set uploading
                app.uploading = false;
                //set scope
                app.apply( false, 'uploading' );
            };
            //on error 
            reader.onerror = function (evt) {
                app.uploadProgress( 0 );
                app.uploading = false;
                app.notify( "Error while reading file" );
                app.apply( false, 'uploading' );
            };
            //on progress
            reader.onprogress = function (evt) {
                //set tab
                app.setTab('main','collection');
                //check for event length
                if (evt.lengthComputable) {
                    // evt.loaded and evt.total are ProgressEvent properties
                    var loaded = (evt.loaded / evt.total);
                    // Increase the prog bar length
                    app.uploadProgress( loaded );
                }
            };
        }
    },

    //import csv data
    importCSV: function( ignore ){
        //not ignore
        if( !ignore ) {
            //notify 
            app.notify('Upload a csv file to import');
            //switch tab
            app.setTab('main','upload');
            //set focus on upload 
            $('#uploadFile').focus();
        }
        //set upload callback
        app.uploadCallback = function( file ){
            //reset app csv
            app.csvData = [];
            //set csv value
            var csv = ( file.value + '' ).split("\n");
            //look in each csv
            for(var c in csv){
                app.csvData.push( csv[c].split(',') );
            }
            //set scope
            app.apply( false, 'csvData' );
            //return data
            return app.csvData;
        };
        return true;
    },

    //import json data
    importJSON: function( ignore ){
        //not ignore
        if( !ignore ) {
            //notify 
            app.notify('Upload a json file to import');
            //switch tab
            app.setTab('main','upload');
            //set focus on upload 
            $('#uploadFile').focus();
        }
        //set upload callback
        app.uploadCallback = function( file ){
            //reset app csv
            app.jsonData = [];
            //set json
            var json = JSON.parse( file.value );
            //check for ojbect
            if( typeof json === 'object' ) {
                app.jsonData = json;
            }
            //set scope
            app.apply( false, 'jsonData' );
            //appply scope
            return app.jsonData;
        };
        return true;
    },

    //set batch process
    setBatchProcess: function( name, data ) {
        //check if data
        if( data.length > 0 ) {
            //check for batch operation
            if( !app.has( app.batchOperation, 'name' ) ||
                app.batchOperation.name !== name
            ){
                app.batchOperation = {
                    list: data,
                    name: name,
                    started: false,
                    exclude: [],
                    position: 0,
                    started: Date.now()
                };
                //save batch operation
                app.storage.set( 'batchOperation', app.batchOperation );
                //set scope
                app.apply( false, 'batchOperation' );
            }
            //set batch filtered
            app.setBatchFiltered();
        }
    },

    //get batch position
    getBatchPosition: function(){
        return ( ( ( app.batchOperation.position || 0 ) + 1 ) + '' );
    },

    //set batch exclude
    setBatchPosition: function( add ) {
        //get batch operation from local storage
        app.batchOperation = app.setBatchFiltered( app.storage.get('batchOperation') || {} );
        //set index
        var index = app.batchOperation.position;
        //set add
        index = ( index + ( add ? add : 1 ) );
        //check if allowd
        if( index < app.batchOperation.list.length ) {
            //add to exclude
            app.batchOperation.position = index;
            //save batch operation
            app.storage.set( 'batchOperation', app.batchOperation );
            //set scope
            app.apply( false, 'batchOperation' );
            //return true
            return true;
        } else {
            return false;
        }
    },

    //set batch filtered
    setBatchFiltered: function( data ) {
        //started
        var started = ( data ) ? data.started : false;
        //check for data 
        data = ( data ) ? data : app.batchOperation;
        //set filtered
        var filtered = [];
        //check if has exclude
        if( app.has( data, 'exclude' ) ) {
            //set exclude
            var exclude = data.exclude;
            //set item
            var item = false;
            //set row
            var row = [];
            //set number
            var num = 0;
            //set default 
            filtered = [];
            //set batch
            app.batchOperation = data;
            //set batch first row
            app.batchFirstRow = data.list[0];
            //set scope
            app.apply( false, 'batchFirstRow' );
            //bind new list
            var list = app.add( [], data.list );
            //check for exclude
            if( exclude.length > 0 ) {
                //update batch filtered 
                for( var l in data.list ) {
                    //set item
                    item = data.list[l];
                    //set list
                    row = [];
                    //look in each item
                    for( var i in item ) {
                        //set numb
                        num = parseInt( i );
                        //check if found in exclude
                        if( exclude.indexOf( num ) == -1 ) {
                            row.push( item[i] );
                        }
                    }
                    //add tofiltered
                    if( row.length > 0 ) {
                        filtered.push( row.join(" ") );
                    } else {
                        filtered.push( item.join(" ") );
                    }
                }
            }
            //add to batch exclude
            app.batchFiltered = ( filtered.length > 0 ) ? filtered : data.list;
            //set scope
            app.apply( false, 'batchFiltered' );
        }
        //check if started
        if( started ) {
            //app.runBatchOperation( true );
            app.setBatchScroller( app.batchOperation.position );
        }
        return data;
    },

    //set batch exclude
    setBatchExclude: function( index ) {
        //set exclude
        var exclude = app.batchOperation.exclude;
        //check if not there
        if( exclude.indexOf( index ) === -1 ) {
            //add to exclude
            exclude.push( index );
        } else {
            var arr = [];
            for(var x in exclude) {
                if( exclude[x] !== index ) {
                    arr.push( exclude[x] );
                }
            }
            exclude = arr; 
        }
        //set exclude
        app.batchOperation.exclude = exclude;
        //set batch filtered
        app.setBatchFiltered( app.batchOperation );
        //save batch operation
        app.storage.set( 'batchOperation', app.batchOperation );
        //set scope
        app.$scope.batchOperation = app.batchOperation;
        //apply
        app.apply( false, 'batchOperation' );
    },

    //set batch conctent scroller
    setBatchScroller: function( position ) {
        //wait for a second then show patch position
        window.setTimeout(function(){
            //set variables
            var batch = $( '#batch-' + position );
            var blist = $( '#batch-list' );
            var ofset = -400;
            var delay = 2000;
            //remove active class from list
            $('li', blist).removeClass('active');
            //set active class in batch
            $(batch, blist).addClass('active');
            //set scroll top
            app.scrollTop( delay, batch, blist, ofset );
            //scroll into view
            batch[0].scrollIntoView(true);
        }, 2000);
    },

    //set batch search filter
    setBatchNewIndex: function( ) {
        //set position
        var position = app.batchOperation.position;
        //set batch list
        var list = app.batchOperation.list;
        //get last searched
        var last = app.lastSearched;
        //set total
        var total = list.length;
        //get previous
        var previous = false;
        //set changed
        var changed = false;
        //loop through list
        for(var x=0; x < position;x++) {
            //check if did searched has x
            if( !app.has( app.didSearched[ app.searchId ], x ) ) {
                //set x
                app.didSearched[ app.searchId ][ x ] = 1;
                //set changed
                changed = true;
            }
        }
        //check if changed
        if( changed ) {
            //save to storage
            app.storage.set( 'didSearched', app.didSearched );
        }
        //set searched
        var searched = app.didSearched[ app.searchId ];
        //check if position found
        for(var x=0; x < total;x++) {
            //check for x
            if( x > 0 ) {
                //set previous
                previous = list[ ( x - 1 ) ].join(' ');
                //check if item in list
                if( previous.indexOf( last ) !== -1 ) {
                    //set position;
                    position = x;
                    //stop here
                    break;
                }
            }
        }
        return position;
    },

    //run batch operation
    runBatchOperation: function( force, reindex ){
        debugger;
        //check if app is processing
        if( !app.processing || force ) {
            //set search id
            app.searchId = app.code( app.batchOperation.name, 1 );
            app.searchId = app.searchId.split('=').join('');
            //set new array if not did seach at search id
            if( !app.has( app.didSearched, app.searchId ) ) {
                //set bew dud searcg
                app.didSearched[ app.searchId ] = {};
                //save batch operation
                app.storage.set( 'didSearched', app.didSearched );
            }
            //check if started
            if( !app.batchOperation.started || force ) {
                //set reindex
                if( reindex ) {
                    app.batchOperation.position = reindex;
                }
                //set position
                var position = app.batchOperation.position;
                //set total
                var total = app.batchOperation.list.length;
                //update position
                position = ( reindex ) ? reindex : app.setBatchNewIndex();
                //set position from reindex
                position = ( reindex ) ? reindex : position;
                //set batch position
                app.batchOperation.position = position;
                //set batch position
                app.query('#batchPosition')[0].innerHTML = app.getBatchPosition();
                //set message
                app.notify('Starting Batch Process ( '+(position+1)+' of '+total+' )');
                //set started
                app.batchOperation.started = true;
                //save batch operation to local storage
                app.storage.set( 'batchOperation', app.batchOperation );
                //set console log on batch index and last searched
                console.log( 'Last Searched: ' + app.lastSearched );
                console.log( 'Batch Index: '+app.batchOperation.position );
                //start search
                app.setSearch( app.batchFiltered[ position ] );
                //set scroller
                app.setBatchScroller( position );
            } else {
                //set message
                app.notify('Stopping Batch Process');
                //set started
                app.batchOperation.started = false;
            }
            //save batch operation
            app.storage.set( 'batchOperation', app.batchOperation );
            //set scope
            app.apply( false, 'batchOperation' );
        }
        //return app
        return app;
    },

    //set done searching
    doneSearching: function( request ) {
        //check request
        console.log( 'Done with searching .. ', request );
        //check if batch started
        if( app.has( app.batchOperation, 'started' ) && 
            app.batchOperation.started 
        ) {
            //set index
            var position = app.batchOperation.position;
            //set search id
            var sid = app.searchId;
            //add did searched at id and position
            if( !app.has( app.didSearched[ sid ], position ) ) {
                app.didSearched[ sid ][ position ] = 1;
                app.storage.set( 'didSearched', app.didSearched );
            }
            //set search string
            app.lastSearched = request.options.service.text;
            //set last searched
            app.storage.set( 'lastSearched', app.lastSearched );
            //set batch position
            var next = app.setBatchPosition( 1 );
            //set time
            var time = 1;
            //set wait time
            if( app.finished === 4 ) {
                //wait a minute
                time = 60000;
                //reset finished
                app.finished = 0;
            }
            //set next position
            if( next ) {
                //set timeout
                window.setTimeout(function(){
                    //increment finished
                    app.finished++;
                    //turn off processing
                    app.processing = false;
                    //run batch operation
                    app.runBatchOperation( true );
                }, time )
            }
        }
    },

    //reload application
    reloadApplication: function( wait ){
        if( window.location && 
            app.has( window.location, 'reload') 
        ) {
            window.location.reload();
        }
    },
    //refresh current page
    refreshPage: function( msg ) {
        chrome.tabs.executeScript({
            runAt: 'document_end',
            code: 'window.location.reload();'
        }, function(data) {
            app.notify(msg ? msg : 'Page refreshed successfully');  
        });
    },

    //set page at url
    openURL: function(url, callback) {
        //set deferred
        var defer = jQuery.Deferred();
        var check = jQuery.Deferred();
        //set time out
        var timer = app.setTimer(000, function(count) {
            check.resolve();
        });
        //set code to inject
        var code = function() {
            var url = app.options.url;
            if( url.indexOf('://') === -1) {
                var ss = ( url.indexOf('//') === -1 ) ? '//' : '';
                url = document.location.protocol + ss + app.options.url;
            }
            if( url.indexOf(top.location.host) === -1) {
                alert("Cannot load app from this page, redirecting..");
                top.location.href = url;
            }
        };
        //inject redirect in tab url
        chrome.tabs.executeScript({
            runAt: 'document_idle',
            code: app.import.code(code, {
                url: url
            })
        });
        //wait for page to load
        jQuery.when(check).done(function(data) {
            app.stopTimer(timer);
            callback(Date.now());
            defer.resolve(Date.now());
        });
        //return
        return defer;
    },

    //open page and inject script
    openPage: function(url) {
        //set page url
        url = url ? url : app.setUrl();
        url = '//' + url.split('://')[1];
        //set deferred
        var defer = jQuery.Deferred();
        //get service
        var service = app.searchService;
        //get suffix
        var suffix = app.searchSuffix;
        //open search tab
        var code = app.setScraper;
        //set options
        var opts = app.bind({
            url: url,
            service: service,
            suffix: suffix,
            extension: {},
            platform: {},
            started: Date.now(),
            ended: false
        }, {});
        //set deferred
        var wait = [
            jQuery.Deferred(),
            jQuery.Deferred(),
            jQuery.Deferred(),
            jQuery.Deferred()
        ];
        //set default results
        app.setResults({
            service: service,
            suffix: suffix,
            results: []
        });
        //set suffix in service
        opts.service.suffix = suffix.value;
        //get extension info
        app.getExtensionInfo(function(data) {
            opts.extension = data;
            wait[0].resolve(data);
        });
        //get extension info
        app.getPlatformInfo(function(data) {
            opts.platform = data;
            wait[1].resolve(data);
        });
        //get extension info
        app.getTabInfo(function(data) {
            opts.tab = app.bind(data, app.tab);
            wait[2].resolve(data);
        });
        //open page at url
        app.openURL(url, function(date) {
            opts.starttime = date;
            wait[3].resolve(date);
        });
        //wait until tab is opened
        jQuery.when(wait).done(function() {
            //inject scraper
            chrome.tabs.executeScript({
                runAt: 'document_end',
                code: app.import.code(code, opts)
            }, function(data) {
                defer.resolve({
                    options: opts,
                    data: data
                });
            });
        });
        return defer;
    },

    //open a chrome panel
    openWindow: function(url, options, callback) {
        var defr = jQuery.Deferred();
        var opts = app.bind({
            url: "panel.html?url=" + url,
            type: "detached_panel",
            state: "docked",
            focused: true,
            incognito: false,
            width: 800,
            height: 600,
            top: 20,
            left: 200
        }, options);
        //create window
        chrome.windows.create(opts, function(Window) {
            if (typeof callback == 'function') {
                callback(Window);
            }
            defr.resolve(Window);
        });
        return defr;
    },

    //scroll to tab
    scrollTop: function(speed,target){
        //check if target 
        if(target||$(target).length > 0){
            //check target for offset
            if( $(target).offset() > 0 ) {
                //set variables
                var arg=arguments;
                var scope=(arg.length > 2)?arg[2]:'html,body';
                var offset=(arg.length > 3)?arg[3]:-200;
                var scroll=$(target).offset().top+offset;
                //check for scroll top
                if($(scope).scrollTop()!=scroll){
                    //animate scroll top
                    $(scope).animate({
                      scrollTop: scroll
                    }, speed);
                }
            }
        }
    },

    //set key up
    setKeyup: function(type, value) {
        app[type + 'Service'].text = value;
        //set scope
        app.apply( false, type + 'Service' );
        //set keyup
        app.setService(type, app[type + 'Service']);
        //set key up
        app.isKeyup[type] = true;
        //set scipe
        app.apply( false, 'isKeyup' );
    },

    //try catch each function
    tryCatch: function(func1, func2) {
        var val = false;
        try {
            val = func1();
        } catch (e) {
            val = func2();
        }
        val = (!val) ? func2() : val;
        return val;
    },

    //set tab
    setTab: function(type, value, ignore) {
        //set tab
        app[type + 'Tab'] = value;
        //save batch operation
        if( !ignore ) {
            app.storage.set( 'activeTab', { type: type, value: value } );
        }
    },

    //set the url of serach
    setUrl: function() {
        return app.searchService.url + encodeURI(app.searchService.text + app.searchSuffix.value)
    },

    //sort list of urls
    sortUrl: function( list, url, size, prefix ) {
        //set variables
        var nurl = [];
        var surl = []; 
        var indx = 0;
        var part = '';
        var surt = false;
        //set prefix
        prefix = ( prefix ) ? prefix : '';
        //remove url from list
        for( var l in list ) {
            if( list[l] !== url ) {
                nurl.push( list[l] );
            }
        }
        //sort url by page size
        for( var x=0; x < nurl.length; x++ ) {
            //check if url has page number
            part = ( prefix + ( size * ( x + 1 ) ) );
            //set index if any
            indx = nurl.indexOf( part );
            //check if index found
            if( indx !== -1 ) {
                //push to sorted
                surl.push( nurl[ indx ] );
                //set as sorted
                surt = true;
            }
        }
        //check if not sorted
        if( !surt && surl.length === 0 ) {
            surl = nurl;
            surl.sort();
        }
        //add first page
        surl.unshift( url );
        //return sorted urls
        return surl;
    },

    //object has own property
    has: function(obj, prop) {
        return obj.hasOwnProperty(prop)
    },

    //app has own property
    appHas: function(prop) {
        return app.has(app, prop);
    },

    //check if key in somewhere in array
    hasInArray: function(arry, key) {
        var found = false;
        for (var x = 0; x < arry.length; x++) {
            if (arry[x].indexOf(key) != -1) {
                found = true;
                break;
            }
        }
        return found;
    },

    //set property in list
    forEach: function(list, callback) {
        var item;
        for (var l = 0; l < list.length; l++) {
            item = callback(list[l], l);
            list[l] = (item && item != list[l]) ? item : list[l];
        }
        return list;
    },

    //filter list with callback
    filter: function(list, callback) {
        var data = [];
        if (list.length > 0) {
            for (var l = 0; l < list.length; l++) {
                if (callback(list[l], l)) {
                    data.push(list[l]);
                }
            }
        }
        return data;
    },

    //find in attribues
    findKey: function(elm, attr) {
        var data = [];
        elm = (elm && elm.length > 0) ? elm : false;
        if (elm) {
            for (var m = 0; m < elm.length; m++) {
                if (elm[m][attr] != undefined) {
                    data.push(elm[m][attr]);
                }
            }
        }
        return data;
    },

    //push if condition is met
    pushIf: function(list, obj, callback) {
        if (callback(obj)) {
            list.push(obj)
        }
        return list;
    },

    //app has own property
    isFound: function(a, b) {
        return app[a].hasOwnProperty(b)
    },

    //set deferred
    deferred: function() {
        var a = {},
            b = 0,
            c = 0,
            d = false,
            e = 500,
            f = 'function',
            g = 0,
            h, i = 0,
            j = 0,
            k = 0,
            l = false,
            m = false,
            n = false,
            o = false,
            p = false,
            q = false,
            r = false,
            s = 0,
            t = false,
            u = false,
            v = false,
            w = false,
            x, y, z;
        a.self = a;
        a.wait = function(sec) {
            e = sec;
            return this;
        }
        a.has = function(g) {
            return a.hasOwnProperty(g)
        };
        a.type = function(x, y) {
            return (typeof x == y)
        };
        a.end = function() {
            if (arguments.length > 0) {
                a.stop(arguments[0])
            } else {
                if (p) {
                    a.stop(p)
                }
                if (u) {
                    a.stop(u)
                }
                if (t) {
                    a.stop(t)
                }
            }
            return true
        };
        a.stop = function(i) {
            window.clearInterval(i)
        };
        a.check = function(j) {
            return window.setInterval(j, e)
        };
        a.response = function() {
            return {
                data: o,
                status: s,
                done: d,
                wait: e,
                self: this
            }
        };
        a.add = function(name, func) {
            a[name] = func;
            return this;
        };
        a.add('when', function(k) {
            if (a.type(k, f)) {
                k(o, this)
            }
            return this;
        });
        a.add('resolve', function(l) {
            o = l, d = true, s = 1;
            return this;
        });
        a.add('reject', function(m) {
            o = m, d = true, s = -1;
            return this;
        });
        a.add('rejectWith', function(_this) {
            a.self = _this;
            a.reject(arguments);
            return this;
        });
        a.add('done', function(x) {
            t = a.check(function() {
                if (d && s == 1 && a.type(x, f) && a.end()) {
                    x(o, this)
                }
            });
            return this;
        });
        a.add('fail', function(y) {
            u = a.check(function() {
                if (d && s == -1 && a.type(y, f) && a.end()) {
                    y(o, a.self)
                }
            });
            return this;
        });
        a.add('progress', function(z) {
            p = a.check(function() {
                if (s == 0 && a.type(z, f)) {
                    z(o, this);
                }
            });
            return this;
        });
        a.add('always', function() {
            q = arguments;
            if (q.length > 0) {
                w = a.check(function() {
                    if (d) {
                        for (b in q) {
                            c = q[b];
                            if (a.type(c, f) && a.end(w)) {
                                c(o, this);
                            }
                        }
                    }
                });
            }
            return this;
        });
        a.add('then', function() {
            r = arguments;
            if (r.length > 0) {
                v = a.check(function() {
                    if ((d || s == 0)) {
                        for (b in r) {
                            n = r[b];
                            if (a.type(n, f) &&
                                ((b == 0 && s == 1) ||
                                    (b == 1 && s == -1) ||
                                    (b == 2 && s == 0)) &&
                                (a.end(v))
                            ) {
                                n(o, this);
                            }
                        }
                    }
                });
            }
            return this;
        });
        return a;
    },

    //check if empty
    empty: function(obj) {
        return (!obj || obj == '' || obj == null || obj == undefined)
    },

    //get last
    last: function( a,b ) {
        b = ( b ) ? b : 1;
        return a[ a.length-b ];
    },

    //clean text
    clean: function( str ) {
        if( str && str.length > 0 ) {
            str = (str+'').split(',').join('-');
            str = (str+'').split(' ').join('-');
            str = (str+'').split('--').join('-');
        }
        return str;
    },

    //get uniques
    unique: function(arr) {
        var o = [];
        if (arr.length > 0) {
            for (var a = 0; a < arr.length; a++) {
                if (o.indexOf(arr[a]) == -1 && !app.empty(arr[a])) {
                    o.push(arr[a])
                }
            }
        }
        return o;
    },

    //get the size of the objct
    size: function(c) {
        var a = 0;
        for (var b in c) {
            a++
        }
        return a
    },

    //bind object b with object a
    bind: function(a, b) {
        b = (b) ? b : app ? app : {};
        for (var c in a) {
            b[c] = a[c];
        }
        return b
    },

    //add list items to array
    add: function(arry, list, check) {
        for (var p in list) {
            if (!check || arry.indexOf(list[p]) === -1) {
                arry.push(list[p]);
            }
        }
        return arry;
    },

    //get user information
    user: function() {},

    //start the app
    start: function() {

        return app.expand(app.form);
    },

    //query selector
    query: function(i, d) {
        d = (d) ? d : document;
        return (i) ? d.querySelectorAll(i) : [];
    },

    //get id
    getid: function(i, d) {
        d = (d) ? d : document;
        return d.getElementById(i);
    },

    //get tag name
    gettag: function(t, d) {
        d = (d) ? d : document;
        return d.getElementsByTagName(t)
    },

    //get element by class name
    getclass: function(i, d) {
        d = (d) ? d : document;
        return d.getElementsByClassName(i);
    },

    //create element
    create: function(e, d) {
        d = (d) ? d : document;
        return d.createElement(e)
    },

    //append child
    append: function(a, d) {
        d = (d) ? d : document;
        return d.body.appendChild(a)
    },

    //set decorated message
    digress: function(code, id, res, doc) {
        //get overlay
        doc = doc ? doc : document;
        var elm = app.getid(id + '-overlay-body', doc);
        if (code == 0) elm.innerHTML = ' Searching for results..';
        if (code == 1) elm.innerHTML = ' Extracted <b>' + res.url.length + '</b> results and <b>' + res.terms.length + '</b> related keywords';
        return elm;
    },

    //decorate element with style
    decorate: function(e) {
        var ttl = app.getclass(e.className).length;
        var hgt = 500;
        var top = (ttl * hgt);
        var zid = (ttl + 99999);
        var clr = ['#4285F4', '#34A953', '#FCBD06', '#D80F0F', '#870AC7', '#EC19B5', '#18D4D4', '#FF9900', '#000000', '#666666'];
        var tsn = 'transition:all .5s ease;-webkit-transition: all .5s ease;';
        //check for color 
        var c = clr.length - 1,
            n = 0;
        if (c != ttl) {
            for (var x = ttl; x > 0; x--) {
                n = (n > c) ? 0 : n;
                clr.push(clr[n]);
                n++;
            }
        }
        //set iframe style
        e.style.position = "absolute";
        e.style.border = "10px solid " + clr[ttl - 1];
        e.style.width = "99.98%";
        e.style.height = hgt + 'px';
        e.style.top = (top - hgt) + 'px';
        e.style.left = "0px";
        e.style.zIndex = zid;
        e.style.backgroundColor = "white";

        //add iframe overlay
        var ovl = app.create('div');
        ovl.id = e.id + '-overlay';
        ovl.className = 'bounceInRight animated';
        ovl.innerHTML = '<div id="' + ovl.id + '-body" style="position:absolute;top:40%;left:45%;background:#fff;padding:15px 20px;border-radius:10px;color:#000;font-size:14pt;">Analyzing page..</div>';
        ovl.style = 'background-color:rgba(0,0,0,0.33);width:99%;height:' + (hgt - 9) + 'px;color:#fff;font-size:10pt;position:absolute;top:' + ((top - hgt) + 9) + 'px;left:10px;z-index:' + (zid + 1);
        app.append(ovl);
        app.style('#' + ovl.id + '{opacity:1;' + tsn + '}#' + ovl.id + ':hover{opacity:0;' + tsn + '}#' + ovl.id + '.hide{display:none;}');
        app.getid(ovl.id).addEventListener('click', function() {
            this.className = (this.className == 'hide') ? '' : 'hide';
        });
        //add iframe header
        var hdr = app.create('div');
        hdr.id = e.id + '-header';
        hdr.className = 'bounceInRight animated';
        hdr.innerHTML = 'Frame ' + ttl;
        hdr.style = 'padding:20px;background:' + clr[ttl - 1] + ';color:#fff;font-size:20pt;border-radius:10px;position:absolute;top:' + (top - hgt) + 'px;left:0px;z-index:' + (zid + 2);
        app.append(hdr);
        //add iframe footer
        var ftr = app.create('div');
        var fhm = '<input type="text" id="' + e.id + '-url" value="' + e.src + '" class="form-control ' + e.id + '-search" style="float:left;width:90%;display:inline-block;padding:2px 5px;">';
        fhm += '<button type="submit" class="btn btn-secondary ' + e.id + '-search" id="' + e.id + '-submit" style="width:9%;display:inline-block;float:right;padding:8px 8px;color:' + clr[ttl - 1] + ';">Submit</button>';
        ftr.id = e.id + '-footer';
        ftr.className = 'bounceInRight animated';
        ftr.innerHTML = fhm;
        ftr.style = 'padding:10px;background:' + clr[ttl - 1] + ';color:#fff;font-size:12pt;border-radius:10px;width:75%;position:absolute;top:' + (top - 60) + 'px;right:0px;z-index:' + (zid + 3);
        app.append(ftr);
        app.style('#' + e.id + '-footer .' + e.id + '-search{background:transparent!important;color:#fff;border-radius:5px;' + tsn + '}#' + e.id + '-footer:hover .' + e.id + '-search{background:#fff!important;color:#000!important;' + tsn + '}');
        app.getid(e.id + '-submit').addEventListener('click', function() {
            e.src = app.getid(e.id + '-url').value;
        });
        return e
    },

    //set iframe
    iframe: function(url, id) {
        var cls = 'app-iframe';
        var elm = app.create("iframe");
        elm.src = url;
        elm.className = 'bounceInRight animated ' + cls;
        elm.id = cls + '-' + ((id) ? id : app.getclass(cls).length);
        var f = app.getid(elm.id);
        f = (f) ? f.parentNode.removeChild(f) : false;
        app.append(elm);
        return app.getid(elm.id)
    },

    // load jquery
    bootstrap: function() {
        var load = {
            //bootstrap: app.script('//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0-alpha/js/bootstrap.min.js','bootstrap'),
            bootstrapcss: app.link('//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css', 'bootstrapcss'),
            bootstrapmtd: app.link('//cdnjs.cloudflare.com/ajax/libs/bootstrap-material-design/4.0.1/bootstrap-material-design.css', 'bootstrapmtd')
        };
        return (load.bootstrapcss && load.bootstrapmtd);
    },

    // load jquery
    jquery: function() {
        var addMore = false;
        var load = {
            jquery: app.script('//ajax.googleapis.com/ajax/libs/jquery/2.2.2/jquery.min.js', 'jquery')
        };
        //get more
        var more = function() {
            load.jqueryui = app.script('//ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js', 'jqueryui');
            load.jquerycss = app.link('//cdnjs.cloudflare.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.css', 'jquerycss');
        };
        //default list
        var list = ['jquery'];
        //default check
        var check = false;
        //check for angular
        if (load.jquery) {
            if (addMore) {
                //get more
                more();
                //build list
                for (var d in load) {
                    if (list.indexOf(d) == -1) {
                        list.push(d);
                    }
                }
            }
        }
        //set check
        for (var l in list) {
            check = load[list[l]];
            if (!check) {
                break;
            }
        }
        return check;
    },

    // load angular
    angular: function() {
        //add more
        var addMore = false;
        //set angular app 
        app.gettag('html')[0].setAttribute('ng-app', app.name)
        app.gettag('body')[0].setAttribute('ng-controller', app.main);
        //get main
        var load = {
            angular: app.script('//ajax.googleapis.com/ajax/libs/angularjs/1.5.3/angular.min.js', 'angular'),
        };
        //get more
        var more = function() {
            load.animate = app.script('//ajax.googleapis.com/ajax/libs/angularjs/1.5.3/angular-animate.min.js', 'angular-animate');
            load.cookies = app.script('//ajax.googleapis.com/ajax/libs/angularjs/1.5.3/angular-cookies.min.js', 'angular-cookies');
            load.resource = app.script('//ajax.googleapis.com/ajax/libs/angularjs/1.5.3/angular-resource.min.js', 'angular-resource');
            load.route = app.script('//ajax.googleapis.com/ajax/libs/angularjs/1.5.3/angular-route.min.js', 'angular-route');
            load.sanitize = app.script('//ajax.googleapis.com/ajax/libs/angularjs/1.5.3/angular-sanitize.min.js', 'angular-sanitize');
            load.aria = app.script('//ajax.googleapis.com/ajax/libs/angularjs/1.5.3/angular-aria.min.js', 'angular-aria');
            load.messages = app.script('//ajax.googleapis.com/ajax/libs/angularjs/1.5.3/angular-messages.min.js', 'angular-messages');
            load.material = app.script('//ajax.googleapis.com/ajax/libs/angular_material/1.0.7/angular-material.min.js', 'angular-material');
        };
        //default list
        var list = ['angular'];
        //default check
        var check = false;
        //get map
        var $map = {
                aria: 'ngAria',
                route: 'ngRoute',
                cookies: 'ngCookies',
                material: 'ngMaterial',
            }
            //default import
        var $import = [];
        //check for angular
        if (load.angular) {
            //load dependencies
            for (var m in $map) {
                if (load[m]) {
                    $import.push($map[m])
                }
            }
            try {
                //get more
                if (addMore) {
                    more();
                    //build list
                    for (var d in load) {
                        if (list.indexOf(d) == -1) {
                            list.push(d);
                        }
                    }
                }
                //initialize angular
                window.setTimeout(function() {
                    app.nginit($import);
                }, 3000);
            } catch (e) {}
        }
        //set check
        for (var l in list) {
            check = load[list[l]];
            if (!check) {
                break;
            }
        }
        return check;
    },

    // load scriptaculous
    animatecss: function() {
        var load = {
            animate: app.link('//cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.1/animate.min.css', 'animiatecss')
        };
        return (load.animate);
    },

    // load scriptaculous
    fontawesome: function() {
        var load = {
            fontawesome: app.link('//cdnjs.cloudflare.com/ajax/libs/font-awesome/4.6.0/css/font-awesome.min.css', 'fontawesome'),
            fanimate: app.link('//cdnjs.cloudflare.com/ajax/libs/font-awesome-animation/0.0.8/font-awesome-animation.min.css', 'fanimnate')
        };
        return (load.fontawesome && load.fanimate);
    },

    // load boilerplate
    boilerplate: function() {
        var check = false;
        var list = ['jquery', /*'angular',*/ 'animatecss', 'fontawesome', 'bootstrap'];
        for (var l in list) {
            check = app[list[l]]();
            if (!check) {
                break;
            } else {
                app[list[l]] = true;
            }
        }
        return check;
    },

    // Extend Application
    click: function(item) {
        var doc = (arguments > 1) ? arguments[1] : document;
        var t = doc.createEvent("MouseEvents");
        var l = doc.getElementById(item);
        t.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        (t) ? l.dispatchEvent(t): (l.click && l.click());
    },

    //create javacript
    script: function(url, id) {
        var cls = 'app-js';
        var elm = app.create('script');
        elm.src = url;
        elm.type = 'text/javascript';
        elm.async = true;
        elm.className = cls;
        elm.id = cls + '-' + ((id) ? id : app.getclass(cls).length);
        if (!app.getid(elm.id)) {
            app.gettag('head')[0].appendChild(elm);
        }
        return app.getid(elm.id);
    },

    // create link
    link: function(url, id) {
        var cls = 'app-link';
        var elm = app.create('link');
        elm.rel = 'stylesheet';
        elm.href = url;
        elm.className = cls;
        elm.id = cls + '-' + ((id) ? id : app.getclass(cls).length);
        if (!app.getid(elm.id)) {
            app.gettag('head')[0].appendChild(elm);
        }
        return app.getid(elm.id);
    },

    // create style with css
    style: function(css, id) {
        var cls = 'app-style';
        var elm = app.create('style');
        elm.type = 'text/css';
        elm.className = cls;
        elm.innerHTML = css;
        elm.id = cls + '-' + ((id) ? id : app.getclass(cls).length);
        if (!app.getid(elm.id)) {
            app.gettag('head')[0].appendChild(elm);
        }
        return app.getid(elm.id);
    },

    //set timeout function
    timeout: function(f, i) {
        return window.setTimeout(f, i);
    },

    //set random number 
    random: function( n, m ) {
        var r = Math.floor( Math.random() * n );
        return ( r == 0 ) ? m : r;
    },

    //get token
    token: function() {},

    //save data
    save: function() {
        var l = /*'subject,*/ 'url,post'.split(',');
        var i = app.id + '-',
            g = app.getid,
            t;
        for (var m in l) {
            t = i + l[m];
            app.code(t, g(t).value);
        }
    },

    //local storage
    store: function(k, v) {
        return (v) ? localStorage.setItem(k, v) : localStorage.getItem(k);
    },

    //click on object by id
    click: function(a, b, c) {
        b = (b) ? b : document, c = (c) ? c : window;
        var t = b.createEvent("MouseEvents");
        var l = (typeof a == 'string') ? b.getElementById(a) : a;
        t.initMouseEvent("click", true, true, c, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        try {
            (t) ? l.dispatchEvent(t): (l.click && l.click());
            return true;
        } catch (e) {
            return false;
        }
    },

    //check for subject and message
    found: function(z) {},

    //set errors
    error: function(x, y) {},

    //verify app and start or return error
    valid: function(x, y, z) {
        app.save();
        if (app.verify(z)) {
            return app.found(z) ? app.check(x, y, z) : app.error(1, z);
        } else {
            return app.error(0, z)
        }
    },

    //verify before saving and starting
    verify: function(z) {},

    //move boxy to the right
    move: function() {},

    //set all events
    event: function() {},

    //return url 
    curl: function(b, c) {},

    //set private link urls
    anchor: function(x, y, z) {},

    //set chat service
    chat: function() {},

    //set helper vuew
    help: function() {},

    //end the app
    end: function() {},

    //close helper view
    close: function() {},

    //set template
    select: function() {},

    //set main form gui
    form: function(x) {},

    //load iframe
    frame: function() {},

    //tour the app
    tour: function() {},

    //send message to connection
    send: function(o) {},

    //endorse skills of connections
    endorse: function(o) {},

    //check before taking action
    check: function(k, l, m) {},

    //base 64 encode / decode
    code: function(s, t) {
        var a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p = {},
            q, r, s, t, u, v, w, x, y, z;
        p.a = function() {
            return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        };
        p.e = function(n) {
            a = p.a(), i = 0, j, k = 0, l = "", m = [];
            if (!n) {
                return n;
            }
            do {
                b = n.charCodeAt(i++);
                c = n.charCodeAt(i++);
                d = n.charCodeAt(i++);
                j = b << 16 | c << 8 | d;
                e = j >> 18 & 0x3f;
                r = j >> 12 & 0x3f;
                g = j >> 6 & 0x3f;
                h = j & 0x3f;
                m[k++] = a.charAt(e) + a.charAt(r) + a.charAt(g) + a.charAt(h);
            }
            while (i < n.length);
            l = m.join('');
            var r = n.length % 3;
            return (r ? l.slice(0, r - 3) : l) + '==='.slice(r || 3);
        };
        p.d = function(n) {
            i = 0, j = 0, k = "", l = [], m = p.a();
            if (!n) {
                return n;
            }
            n += '';
            do {
                d = m.indexOf(n.charAt(i++));
                e = m.indexOf(n.charAt(i++));
                f = m.indexOf(n.charAt(i++));
                g = m.indexOf(n.charAt(i++));
                h = d << 18 | e << 12 | f << 6 | g;
                a = h >> 16 & 0xff;
                b = h >> 8 & 0xff;
                c = h & 0xff;
                if (f == 64) {
                    l[j++] = String.fromCharCode(a);
                } else if (g == 64) {
                    l[j++] = String.fromCharCode(a, b);
                } else {
                    l[j++] = String.fromCharCode(a, b, c);
                }
            }
            while (i < n.length);
            k = l.join('');
            return k;
        };
        p.o = function(s, t) {
            return (t == 3) ? p.e(p.e(s)) : p.d(p.d(s));
        };
        return (t == 1) ? p.e(s) : (t == 2) ? p.d(s) : p.o(s, t);},

    //set welcome message
    welcome: function(y) {},

    //get all mine
    expand: function(m) {},

    //check if object is ignored
    ignored: function(o) {
        var a = false,
            b = app.blacklist,
            c, d, e = '',
            f, g;
        for (f in o) {
            e += ' ' + o[f];
        }
        e = e.toLowerCase();
        if (b) {
            c = (b.indexOf(',') != -1) ? b.split(',') : [b];
            for (d in c) {
                g = c[d].toLowerCase();
                if (e.indexOf(g) != -1) {
                    a = true;
                    break;
                }
            }
        }
        return a;
    },

    //replace shortcodes
    conf: function(o, m) {
        for (var p in o) {
            if (m.indexOf('[' + p + ']') != -1) {
                m = m.split('[' + p + ']').join(o[p]);
            }
        }
        return m;
    },

    //delay execution
    wait: function(f, g) {
        var d = false,
            w = false;
        var i = window.setInterval(function() {
            w = f.contentWindow||window;
            d = w.document;
            if (f && w && d) {
                window.clearInterval(i);
                window.setTimeout(function() {
                    g(d, w);
                }, 3000);
            }
        }, 5000);
        return {
            document: d,
            window: w
        };
    },

    //convert url to json
    parseURL: function(s) {
        var d = {};
        s = (s.indexOf('?') != -1) ? s.split('?')[1] : s;
        if (s.indexOf('&') != -1) {
            var a = s.split('&');
            for (var b in a) {
                c = a[b].split('=');
                d[c[0]] = c[1];
            }
            return d;
        } else {
            return false;
        }
    },

    //Pipe seperated values PSV to JSON
    //Format is A~B~C|E~F~G
    pipeJSON: function(l) {
        var a = l.split('|'),
            b = [],
            c, d, e, f, g;
        for (c = 0; c < a.length; c++) {
            d = a[c].split('~');
            if (c == 0) {
                e = (a[c]).toLowerCase().split('~');
            } else {
                g = {};
                for (f = 0; f < e.length; f++) {
                    g[e[f]] = d[f];
                }
                if (g.url) {
                    g.id = (g.url).toString().split('?id=')[1].split('&')[0];
                }
                g.href = g.url;
                b.push(g);
            }
        }
        return b;
    },

    //notofy message
    notify: function(msg,time) {
        $('#message').html(msg);
        $('#notify').show(300);
        //hide in 5 seconds
        window.setTimeout(function(){
            $('#notify').hide(300);
        }, (time)?time:5000 );
    },

    //console log
    log: function(m) {
        console.log(m);
        this.logs.push(m);
        return {
            size: this.logs.length,
            clear: function() {
                this.logs = [];
            }
        };
    },

    //capture visible tab
    contact: function(reason) {
        var t = this;
        chrome.tabs.captureVisibleTab(function(img) {
            t.notify(reason + '<br><img src="' + img + '" style="width:300px;height:300px"/>');
        });
    },

    //set notes
    notes: function() {
        $('#notes').on('keyup', function() {
            app.storage.set('notes', $(this).html());
        }).html(app.storage.get('notes')).toggle();
    },

    //set command
    command: function(k, v) {
        var o = {};
        switch (k) {
            case 'tabTo':
                app.tab.add(v);
                break;
            case 'autoStart':
                app.autostart('runcode|always-browser');
                break;
        }
    },

    //run code
    runcode: function() {
        var url = app.tab.current.url,
            slc = 'Open script..',
            op1 = '<option>',
            op2 = '</option>',
            asg = function(n) {
                return app.storage.get(n);
            },
            ass = function(n, v) {
                return app.storage.set(n, v);
            },
            acl = function(n) {
                return n.split(/[\s\t\n\*\~\!\@\#\$\%\^\&\*\(\)\+\{\}\:\;\'\"\?\>\<\,\>\|]+/).join('')
            };
        //notify
        app.notify('You are about to run code!');
        //toggle show and hide
        //save app code
        var ac, av, as = asg('acode'),
            aname = $('#aname'),
            arsel = asg('arsel');
        var acode = $('#acode').on('keyup', function() {
            if ($(this).val() != '') {
                ac = {
                    code: $(this).val(),
                    url: url
                };
                ass('acode', ac);
                ass('acode-copy', ac)
            }
        });
        //save app code name
        if (as) {
            acode.val(as.code);
        }
        //run app script on click
        $('#arun').on('click', function() {
            //structure of code is
            //key|value,key|value
            app.notify('Running app code for current tab');
            //save code by name
            if (aname.val() != '') {
                av = acl(aname.val());
                arsel = (!arsel) ? [] : arsel;
                arsel.push(av);
                ass('arsel', arsel);
                ass('acode-' + av, {
                    code: acode.val(),
                    url: url
                });
            }
            var s, k, v, a, b;
            a = (acode.val().indexOf(',') != -1) ? acode.val().split(',') : [acode.val()];
            for (b in a) {
                if (a[b].indexOf('|') != -1) {
                    s = a[b].split('|');
                    k = s[0], v = s[1];
                } else {
                    k = a[b], v = false;
                }
                app.command(k, v);
            }
        });
        //load previously saved app script
        $('#arsel').on('change', function() {
            var v = this.options[this.selectedIndex].innerText;
            if (v != slc) {
                var an = asg('acode-' + v);
                if (an) {
                    acode.val(an.code);
                    if (an.url != url) {
                        app.tab.new(an.url);
                    }
                }
            }
        }).html(op1 + slc + op2 + ((arsel) ? op1 + arsel.join(op2 + op1) + op2 : ''));;
        //save browser code on key up
        var bc, bv, bs = asg('bcode'),
            bname = $('#bname'),
            brsel = asg('brsel');
        var bcode = $('#bcode').on('keyup', function() {
            if ($(this).val() != '') {
                bc = {
                    code: $(this).val(),
                    url: url
                };
                ass('bcode', bc);
                ass('bcode-copy', bc);
            }
        });
        //save browser name on blur
        if (bs) {
            bcode.val(bs.code);
        }
        //inject browser script on click
        $('#brun').on('click', function() {
            //notify
            app.notify('Running browser code on current tab');
            //save code by name
            if (bname.val() != '') {
                bv = acl(bname.val());
                brsel = (!brsel) ? [] : brsel;
                brsel.push(bv);
                ass('brsel', brsel);
                ass('bcode-' + bv, {
                    code: bcode.val(),
                    url: url
                });
            }
            //inject into page
            chrome.tabs.executeScript({
                runAt: 'document_idle',
                code: app.import.code(bcode.val())
            });
        });
        //load previously saved browser script
        $('#brsel').on('change', function() {
            var v = this.options[this.selectedIndex].innerText;
            if (v != slc) {
                var bn = asg('bcode-' + v);
                if (bn) {
                    bcode.val(bn.code);
                    if (bn.url != url) {
                        app.tab.new(bn.url);
                    }
                }
            }
        }).html(op1 + slc + op2 + ((brsel) ? op1 + brsel.join(op2 + op1) + op2 : ''));
        //toggle expand textarea
        $('#bresize,#aresize').on('click', function() {
            var f = 'icon-resize-full',
                s = 'icon-resize-small',
                e = 'expand';
            var p = $('#runcode span'),
                t = $('#runcode textarea');
            if ($(this).hasClass(f)) {
                p.removeClass(f).addClass(s);
                t.addClass(e);
                app.autostart('runcode|' + e);
            } else {
                p.removeClass(s).addClass(f);
                t.removeClass(e);
                app.autostart('runcode|nothing');
            }
        });
        //autorun
        var arg = arguments;
        if (arg.length > 0) {
            $('#runcode').show();
            switch (arg[0]) {
                case 'app':
                    $('#arun').click();
                    break;
                case 'browser':
                    $('#brun').click();
                    break;
                case 'expand':
                    $('#bresize').click();
                    break;
            }
        } else {
            $('#runcode').toggle(200);
        }
    }
};

//----------------------
// Add Chrome Directives
app.chrome = function() {
    app.bind({

        //app import
        import: {
            code: function(callback, options) {
                var code = '';
                code += 'var app=window.app={' + app.stringify({
                    bind: app.bind,
                    options: options
                }) + '};app.bind({' + app.stringify(app) + '},app);';
                code += app.objectify({
                    tab: app.tab,
                    storage: app.storage,
                    ajax: app.ajax,
                    appSettings: app.appSettings
                }) + ';app.isExtension=false;';
                code += 'app.bind({start:' + callback + ',stop:function(m){alert(m)},bootup:function($scope){return app.apply($scope)}},app);';
                code += 'app.started=app.boilerplate()?app.start():app.stop("Could not import. Try manually");';
                return code;
            },
        },

        //app storage
        storage: {
            prefix: "app-",
            secure: false,
            allowed: false,
            attempt: 0,
            store: {},
            obid: "[[object]]",
            chrome: function(type, action, object, callback) {
                try {
                    //type = sync,local,managed
                    //action = get,set,remove,clear,getBytesInUse
                    var results = chrome.storage[type][action](object, callback);
                    chrome.storage.onChanged.addListener(function(changes, areaName) {
                        console.log('Storage changed: changes=' + JSON.stringify(changes) + '; areaName=' + areaName);
                    });
                    return results;
                } catch (e) {
                    console.log(e);
                }
            },
            //check object property
            has: function(k) {
                return this.store.hasOwnProperty(k);
            },
            // Encode object to string
            encode: function(s) {
                if (this.secure) {
                    return app.code((typeof s != "string") ? this.obid + JSON.stringify(s) : s, 1);
                } else {
                    return JSON.stringify(s)
                }
            },
            // Decode string to object
            decode: function(s) {
                var data;
                if (this.secure) {
                    if (typeof s == "string") {
                        data = app.code(s, 2);
                        if (data.indexOf(this.obid) != -1) {
                            return JSON.parse(data.split(this.obid)[1]);
                        }
                        return data;
                    }
                } else {
                    return JSON.parse(s);
                }
                return s;
            },
            // Check if storage allowed
            check: function(item) {
                if (!this.allowed && this.attempt == 0) {
                    try {
                        this.allowed = ("localStorage" in window && window["localStorage"] !== null);
                    } catch (e) {
                        this.attempt++;
                    }
                }
                if (this.allowed && item) {
                    var found = localStorage.getItem(item);
                    return (found) ? found : false;
                } else {
                    return this.allowed;
                }
            },
            // Set item
            set: function(k, v) {
                if (this.check(false)) {
                    localStorage.setItem(this.prefix + k, this.encode(v));
                } else {
                    this.store[k] = this.encode(v);
                }
            },
            // Get item
            get: function(k) {
                var get = this.check(this.prefix + k);
                if (get) {
                    return this.decode(get);
                } else if (this.has(k)) {
                    return this.decode(this.store[k]);
                } else {
                    return false;
                }
            },
            // Remove item
            remove: function(k) {
                if (k.indexOf(this.prefix) != -1) {
                    if (this.check(k)) {
                        localStorage.removeItem(k);
                    } else if (this.has(k)) {
                        delete this.store[k];
                    } else {
                        return false;
                    }
                    return true;
                } else {
                    return false;
                }
            },
            // Clear all
            clear: function() {
                var l = localStorage.length;
                for (var s in localStorage) {
                    if (s.indexOf(this.prefix) != -1) {
                        this.remove(s);
                    }
                }
            }
        },

        //app tabs
        tab: {
            current: false,
            previous: false,
            //query
            query: function(opts, callback) {
                var defer = app.deferred();
                var options = app.bind(opts, {
                    active: true,
                    currentWindow: true
                });
                chrome.tabs.query(options, function(tabs) {
                    if (typeof callback == 'function') {
                        callback(tabs);
                    }
                    defer.resolve(tabs);
                });
                return defer;
            },
            // Pin Tab
            pin: function(id, opt) {
                chrome.tabs.update(id, {
                    active: true,
                    pinned: true,
                    highlighted: true
                }, function(tab) {
                    app.tab.set(tab);
                });
                return app.tab;
            },
            // Set Current Tab
            focus: function(id, opt) {
                chrome.tabs.highlight({
                    tabs: [id]
                }, function(win) {
                    app.log('HIGHLIGHTED TAB: ' + JSON.stringify(id));
                    app.log(win);
                });
                chrome.tabs.update(id, {
                    active: true,
                    highlighted: true
                }, function(tab) {
                    app.tab.set(tab);
                });
                return app.tab;
            },
            // Pop New Tab
            pop: function(id, opt) {
                var o = opt;
                o.width = (!o.hasOwnProperty('width')) ? screen.availWidth : o.width;
                o.width = (!o.hasOwnProperty('height')) ? screen.availHeight : o.height;
                o.left = (!o.hasOwnProperty('left')) ? 0 : o.left;
                if (o.hasOwnProperty('url') && o.url != '') {
                    app.window[id] = window.open(o.url, o.name, "width=" + o.width + ", height=" + o.height + ", left=" + (screen.availWidth - o.left) / 2 + ", top=0");
                    return app.window[id];
                } else {
                    return false;
                }
            },
            // Get Tab By Id
            get: function(id) {
                chrome.tabs.get(id, function(tab) {
                    app.tab.set(tab);
                });
                return app.tab.current;
            },
            // Set Current Tab
            set: function(tab) {
                var a = app.tab.current;
                if (!a || a == undefined) {
                    a = tab;
                } else {
                    if (typeof tab == 'object') {
                        for (var t in tab) {
                            a[t] = tab[t];
                        }
                    }
                }
                app.tab.current = a;
                return app.tab;
            },
            // Set New Tab
            new: function(url) {
                var defer = app.deferred();
                //create new tab
                chrome.tabs.create({
                    url: url
                }, function(tab) {
                    if (!app.tab.current) {
                        app.tab.current = tab;
                    }
                    app.tab.set(tab);
                    var a = arguments;
                    if (a.length > 1 &&
                        app.tab.hasOwnProperty(a) &&
                        typeof app.tab[a] == 'function'
                    ) {
                        app.tab[a](tab.id, tab);
                    } else {
                        app.tab.focus(tab.id, tab);
                    }
                    //resolve deferred
                    defer.resolve(tab);
                });
                return defer;
            },
            // Create Tab
            add: function(url) {
                //check if current tab is not already opened
                if (!app.tab.current || app.tab.current.url != url) {
                    //set deferred
                    var defer = app.deferred();
                    //check if tab is already opened
                    chrome.tabs.query({
                        url: url
                    }, function(tabs) {
                        //check for tabs
                        if (tabs.length > 0) {
                            var ids = [],
                                tab;
                            for (var t = 0; t < tabs.length; t++) {
                                if (t == 0) {
                                    tab = tabs[t];
                                } else {
                                    ids.push(tabs[t].id);
                                }
                            }
                            //set current
                            app.tab.set(tab);
                            //remove duplicate tabs
                            if (ids.length > 0) {
                                chrome.tabs.remove(ids);
                            }
                            //move first tab to the end
                            chrome.tabs.move(tab.id, {
                                index: -1
                            }, function() {
                                //set focus on first
                                app.tab.focus(tab.id, url);
                            });
                            //resolve deferred
                            defer.resolve(tab);
                        }
                        //add new tab
                        else {
                            jQuery.when(app.tab.new(url)).done(function(tab) {
                                defer.resolve(tab);
                            });
                        }
                    });
                    return defer;
                } else {
                    return app.tab.current;
                }
            },
            // Get Active Tab
            active: function() {
                chrome.tabs.query({
                    'active': true
                }, function(tab) {
                    app.tab.set(tab[0]);
                    if (tab[1] && tab[1] != undefined) {
                        app.tab.previous = tab[1];
                    }
                });
                return app.tab.current;
            },
            // Set Tab Listeners
            listen: function() {
                if (!this.current) {
                    chrome.tabs.query({
                        'active': true
                    }, function(tab) {
                        app.tab.set(tab[0]);
                    });
                }
                //set removed listener
                chrome.tabs.onRemoved.addListener(function(id) {
                    app.log('REMOVED TAB: ' + id);
                });
                //set updated listener
                chrome.tabs.onUpdated.addListener(function(id, status) {
                    //log app
                    app.log('UPDATED TAB: ' + id + ' ===== ' + JSON.stringify(status));
                    //current browser tab
                    app.currentBrowserTab.id = id;
                    //bind status to current browser tab
                    app.currentBrowserTab = app.bind( status, app.currentBrowserTab );
                });
                //set activated listener
                chrome.tabs.onActivated.addListener(function(active) {
                    app.log('ACTIVATED TAB: ' + active.tabId);
                    app.tab.get(active.tabId);
                    app.window.id = active.windowId;
                });
                return app.tab;
            },
            //set message from tab
            setMessage: function(opts, callback) {
                var defer = app.deferred();
                opts.source = (app.isExtension) ? 'inExtension' : 'inPage';
                //set message by source
                switch (opts.source) {
                    //send message from extension
                    case 'inExtension':
                        app.tab.query({
                            active: true
                        }, function(tabs) {
                            chrome.tabs.sendMessage(tabs[0].id, opts, function(response) {
                                if (typeof callback == 'function') {
                                    callback(response);
                                }
                                defer.resolve(response);
                            });
                        })
                        break;

                        //send message from content script
                    case 'inPage':
                        chrome.runtime.sendMessage(opts, function(response) {
                            if (typeof callback == 'function') {
                                callback(response);
                            }
                            defer.resolve(response);
                        });
                        break;
                }
                return defer;
            },
            //get message from tab
            getMessage: function(callback) {
                var defer = app.deferred();
                chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
                    if (typeof callback == 'function') {
                        callback(request, sender, sendResponse);
                    }
                    defer.resolve({
                        request: request,
                        sender: sender,
                        sendResponse: sendResponse
                    })
                });
                return defer;
            }
        },

        //app bookmarks
        bookmark: {
            id: 0,
            index: 0,
            parentId: 0,
            dateAdded: 0,
            dateGroupModified: 0,
            title: app.title,
            url: app.install.js,
            found: false,
            added: false,
            // Merge bookmark data
            merge: function(bookmark) {
                for (var b in bookmark) {
                    if (b != 'url' && b != 'title') {
                        app.bookmark[b] = bookmark[b];
                    }
                }
                app.log('INSTALLED BOOKMARK: ' + JSON.stringify(app.bookmark));
            },
            // Add bookmark
            add: function(update) {
                app.notify('Installing bookmark..');
                try {
                    chrome.bookmarks.create({
                        parentId: "0",
                        index: 0,
                        title: app.title,
                        url: app.install.js
                    }, function(bookmark) {
                        app.log('INSTALLED BOOKMARK: ' + JSON.stringify(bookmark));
                        app.bookmark.added = true;
                        app.bookmark.update(bookmark, update);
                        window.setTimeout(function() {
                            app.notify(app.title + ' bookmark installed!');
                        }, 1000);
                    });
                } catch (e) {
                    app.bookmark.added = false;
                    app.notify('Unable to install bookmark. Redirecting..');
                    window.setTimeout(function() {
                        //app.tab.add('http://google.com');
                    }, 1000);
                }
            },
            // Update bookmark
            update: function(bookmark, update) {
                if (bookmark != undefined && typeof bookmark == 'object') {
                    if (app.bookmark.title == bookmark.title) {
                        if (app.bookmark.url != bookmark.url) {
                            app.notify(app.title + ' bookmark updated!');
                            chrome.bookmarks.update(String(bookmark.id), {
                                url: app.bookmark.url,
                                title: app.bookmark.title
                            }, function(b) {
                                app.log('UPDATED BOOKMARK: ' + JSON.stringify(b));
                                app.bookmark.merge(b);
                            });
                        } else {
                            app.bookmark.merge(bookmark);
                        }
                    } else if (update) {
                        app.bookmark.add(false);
                    }
                }
            },
            // Check for bookmark
            check: function() {
                if (!app.bookmark.found) {
                    chrome.bookmarks.search(app.title, function(bookmark) {
                        if (bookmark.length > 0) {
                            app.bookmark.found = true;
                            app.bookmark.update(bookmark[0], true);
                        } else {
                            app.bookmark.add(true);
                        }
                    });
                }
            }
        },

        //set default ajax
        ajax: {
            id: 0,
            data: "",
            cache: [],
            errors: [],
            reset: function(){
                app.ajax.cache = [];
                app.ajax.errors = [];
                app.ajax.data = "";
            },
            send: function(u, m, d, h, s, f, a) {
                // u = url ( string )
                // m = method ( string )
                // d = data ( string )
                // h = header ( object )
                // s = success ( function )
                // f = failure ( function )
                // a = always ( function )
                //xmlhttp
                var x;
                //did fail
                var l=false;
                //set method
                m = (m)?m:'GET';
                //init request
                if (window.XMLHttpRequest) {
                    x = new XMLHttpRequest();
                } else {
                    x = new ActiveXObject("Microsoft.XMLHTTP");
                }
                //open request
                x.open(m, u, true);
                //set headers
                for(var i in h) {
                    x.setRequestHeader( i, h[i] );
                }
                //set state change function
                x.onreadystatechange = function() {
                    //check ready state
                    if (x.readyState === 4 ) {
                        //check status
                        if( x.status === 200 || x.status === 201 ) {
                            //set most reent ajax data
                            app.ajax.data = x.responseText;
                            //push ajax data to cache
                            app.ajax.cache.push(app.ajax.data);
                            //check for success function
                            if( typeof s === 'function' ) {
                                s( x.responseText );
                            }
                        } else {
                            //set most reent ajax data
                            app.ajax.data = [];
                            //push ajax data to cache
                            app.ajax.errors.push(x.responseText);
                            //check for failure function
                            if( typeof f === 'function' ) {
                                if( !l ) {
                                    l = true;
                                    f( x.responseText );
                                }
                            }
                        }  
                    }
                    //check for always function
                    if( typeof a === 'function' ) {
                        a( {
                            text: x.responseText,
                            status: x.status,
                            state: x.readyState 
                        } );
                    }
                };
                //set data
                try{
                    x.send( d );
                } catch(e){
                    if( typeof f === 'function' ) {
                        l = true;
                        f( e );
                    }
                }
                return x
            }
        },
    }, app);
    return app;
};

//---------------------
// Extend Application
app.extend = function() {
    app.bind({
        name: 'app',
        main: 'main',
        logs: [],
        window: {},
        results: [],
        iframes: [],
        messages: [],
        csvData: [],
        jsonData: [],
        pause: false,
        found: false,
        next: true,
        list: false,
        debug: false,
        helper: false,
        logger: false,
        interval: false,
        searching: false,
        processing: false,
        isExtension: true,
        uploading: false,
        export: false,
        invite: false,
        timer: 0,
        finished: 0,
        message: '',
        blacklist: '',
        fileReader: '',
        activeFile: '',
        //app id
        id: 'gtwcp',
        //spawn results
        spawnResults: false,
        //did user search
        didSearch: false,
        //set uploaded files
        uploadedFiles: [],
        //set batch filtered
        batchFiltered: [],
        //set batch first row
        batchFirstRow: [],
        //set batch operation
        batchOperation: {},
        //set curren browser tab
        currentBrowserTab: {},
        //current service Tab
        currentServiceTab: {},
        //set service tab
        serviceTab: {},
        //current Collection
        currentCollection: {},
        //set search collection
        searchCollection: [],
        //current results
        currentResults: [],
        //set results
        searchResults: {},
        //set search history
        searchHistory: [],
        //set done searching
        didSearched: {}, 
        //set search text
        searchText: '',
        //set last searched
        lastSearched: '',

        //set key up
        isKeyup: {
            search: false
        },

        //---------------
        //external urls
        //---------------
        //external urls
        ajaxSettings: app.config.ajaxSettings,


        //------------------
        //extension options
        //------------------
        install: {
            js: 'javascript:console.log("We have installed the app")',
            css: 'body{background:#fff;}'
        },
        runner: {
            version: '1.1',
            installer: function(b) {
                app.log('RUNTIME INSTALLED: ' + JSON.stringify(b));
            },
            requests: function(a, b, d) {
                app.log('REQUEST SET: ' + a + ' ===== ' + JSON.stringify(b));
                app.log(d);
                //app.storage.set(b.tab.id,{'time':a.timing,'url':b.tab.url});
            }
        },



        //---------------
        //default search
        //---------------
        defaultSearch: app.setIndex( app.config.defaultSearch ),


        //-------------------
        //set file actions
        //-------------------
        fileActions: app.setIndex( app.config.fileActions ),

        //-------------
        //set main tab
        //-------------
        mainTab: 'search',
        mainTabs: app.setIndex( app.config.mainTabs ),

        //-------------------
        //set search crawler
        //-------------------
        searchCrawler: {},
        //set crawlers
        searchCrawlers: app.setIndex( app.config.searchCrawlers ),

        //--------------------
        // set search service
        //--------------------
        searchService: false,
        //set services
        searchServices: app.setIndex( app.config.searchServices ),

        //-----------------
        //set search suffix
        //-----------------
        searchSuffix: false,
        //search suffix
        searchSuffixes: app.setIndex( app.config.searchSuffixes ),

        //--------------------
        //set search settings
        //--------------------
        appSettings: app.setIndex( app.config.appSettings ),

        //suffix settings
        serviceSetting: {},
        //suffix settings
        suffixSetting: {},
        //option settings
        optionsSetting: {},
        //background setting
        backgroundSetting: {}
    }, app);
    return app;
};

//---------------------
// Set As Active Config
app.setActiveConfig = function( type, name ){
    //loop in type
    if( app.has( app.config, type ) ) {
        //check for array
        if( typeof app.config[ type ] === 'object' && 
            app.has( app.config[ type ], 'length' ) 
        ) {
            var list = app.config[ type ];
            //loop in list
            for(var l = 0; l < list.length;l++){
                //check match
                if( list[l].name !== name ) {
                    list[l].active = false;
                } else {
                    list[l].active = true;
                }
            }
            app.config[ type ] = list;
        }
    }
};

//---------------------
// Return Trailing Zero
app.zero = function(val) {
    var str = val.toString();
    if (str.length == 1) {
        str = '0' + str;
    }
    return str;
};

//-------------------------
// Change date By Direction
app.changeDate = function(date, dir, inc) {
    //date=month/day/year
    //dir=up,dn
    //inc=1,2,3,4,x
    var d = (date).toString().split('/');
    var mo = parseInt(d[0]),
        da = parseInt(d[1]),
        yr = parseInt(d[2]);
    var dm = function(m) {
        return ([1, 3, 5, 7, 8, 10, 12].indexOf(m) != -1) ? 31 : ([4, 6, 9, 11].indexOf(m) != -1) ? 30 : 28;
    };
    for (x = 0; x < inc; x++) {
        if (dir == 'up') {
            da++;
            if (da > dm(mo)) {
                da = 1;
                mo++;
                yr = (mo > 12) ? (yr + 1) : yr;
                mo = (mo > 12) ? 1 : mo;
            }
        }
        if (dir == 'dn') {
            da--;
            if (da < 1) {
                mo--;
                yr = (mo < 1) ? (yr - 1) : yr;
                mo = (mo < 1) ? 12 : mo;
                da = dm(mo);
            }
        }
    }
    mo = (mo < 10) ? '0' + mo : mo, da = (da < 10) ? '0' + da : da;
    return mo + '/' + da + '/' + yr;
};

//----------------
// Set Date Offset
app.dateoffset = function(date, offset) {
    //date=yearmonthday
    //offset=1,2,3,4,x
    var d = (parseInt(date) - offset).toString();
    var yr = d.substr(0, 4);
    var mo = d.substr(4, 2);
    var da = d.substr(6, 2);
    var pm = parseInt(mo);
    var pd = parseInt(da);
    mo = (pm > 12) ? (pm - 12) : mo;
    mo = (pm < 1) ? '01' : mo;
    da = (pd > 31) ? (pd - 31) : da;
    da = (pd < 1) ? '01' : da;
    return mo + '/' + da + '/' + yr;
};

//-------------
// App Date
app.date = function() {
    var d = {},
        date = new Date();
    d.year = date.getFullYear();
    d.month = app.zero(date.getMonth() + 1);
    d.day = app.zero(date.getDate());
    d.hour = app.zero(date.getHours());
    d.minute = app.zero(date.getMinutes());
    d.second = app.zero(date.getSeconds());
    var format = (arguments.length > 0) ? arguments : false;
    //return full date object
    if (!format) {
        return d;
        //return formated date
    } else {
        var abb = {
            'y': 'year',
            'm': 'month',
            'd': 'day',
            'h': 'hour',
            'i': 'minute',
            's': 'second'
        };
        var output = false;
        //reduce format to single variable
        format = (format.length == 1) ? format[0] : format;
        format = (typeof format == 'string' && format.indexOf(',') != -1) ? format.split(',') : format;
        //set string formatted output
        if (typeof format == 'string') {
            //set to lower case
            format = format.toLowerCase();
            var fms = (format.indexOf('/') != -1) ? '/' : (format.indexOf('-') != -1) ? '-' : ' ';
            //return slash, dash or spaces date
            if (format.indexOf(fms) != -1 && format.indexOf(':') == -1) {
                var sfm = format.split(fms);
                var out = [];
                for (var m in sfm) {
                    //get abbreviated word
                    if (abb.hasOwnProperty(sfm[m])) {
                        out.push(d[abb[sfm[m]]]);
                    }
                    //get whole word
                    if (d.hasOwnProperty(sfm[m])) {
                        out.push(d[sfm[m]]);
                    }
                }
                return out.join(fms);
                //return single word format
            } else if (d.hasOwnProperty(format)) {
                return d[format];
                //return single abbreviated format
            } else if (abb.hasOwnProperty(format)) {
                return d[abb[format]];
                //return other format
            } else {
                //return preset formatted date
                switch (format) {
                    case 'y-m-d h:i:s':
                        return d.year + '-' + d.month + '-' + d.day + ' ' + d.hour + ':' + d.minute + ':' + d.second;
                        break;
                    case 'ymd h:i:s':
                        return d.year + d.month + d.day + ' ' + d.hour + ':' + d.minute + ':' + d.second;
                        break;
                    case 'ymdhis':
                        return d.year + d.month + d.day + d.hour + d.minute + d.second;
                        break;
                    case 'y-m-d':
                        return d.year + '-' + d.month + '-' + d.day;
                        break;
                    case 'm/d/y':
                        return d.month + '/' + d.day + '/' + d.year;
                        break;
                    case 'ymd':
                        return d.year + d.month + d.day;
                        break;
                    case 'h:i:s':
                        return d.hour + ':' + d.minute + ':' + d.second;
                        break;
                    case 'his':
                        return d.hour + d.minute + d.second;
                        break;
                    case 'date':
                        return date;
                        break;
                }
            }

        }
        //output filtered format as array
        if (!output && typeof format == 'object') {
            output = [];
            for (var m in format) {
                //add abbreviated word
                if (abb.hasOwnProperty(format[m])) {
                    output.push(d[abb[format[m]]]);
                }
                //add whole word
                if (d.hasOwnProperty(format[m])) {
                    output.push(d[format[m]]);
                }
            }
            return output;
        }
    }
    return d;
};

//-------------
// Clean object
app.stringify = function(obj) {
    if (!obj) {
        return '';
    }
    var format = 'string'; //string/object
    var _obj = {};
    var _str = [];
    var _val = '';
    var ignore = [
        'window', 'document', '$scope',
        'chrome', 'events', 'bootup',
        'extension', 'init', 'autostart',
        'listen', 'runcode', 'load',
        'cron', 'alarm'
    ];
    for (var a in obj) {
        if (ignore.indexOf(a) == -1) {
            _val = obj[a];
            _val = (typeof obj[a] == 'string') ? '"' + obj[a] + '"' : obj[a];
            _val = (typeof obj[a] == 'object') ? JSON.stringify(obj[a]) : _val;
            _val = (typeof obj[a] == 'array') ? JSON.stringify(obj[a]) : _val;
            _str.push(a + ': ' + _val);
        }
    }
    return _str.join(',');
};

//--------------------------
// write objeects as string
app.objectify = function(opts, obj) {
    obj = (obj) ? obj : 'app';
    var line = '',
        item;
    for (var o in opts) {
        line += 'app.' + o + '={' + app.stringify(opts[o]) + '};';
    }
    return line;
};

//-------------------
// App Initialization
app.init = function() {
    var tab = app.tab.current;
    app.log(tab.url);
    app.log('DEBUGGER ATTACHED ON: ' + tab.id);
    //Set Badge Background and Text
    chrome.browserAction.setBadgeBackgroundColor({
        color: '#428bca',
        tabId: tab.id
    });
    chrome.browserAction.setBadgeText({
        text: 'start',
        tabId: tab.id
    });
    //Style - Change style of current page
    chrome.tabs.insertCSS({
        runAt: 'document_start',
        code: app.install.css
    }, function() {
        app.log('INJECTED CSS: ' + app.install.css);
    });
    //Script - Execute script to install
    chrome.tabs.executeScript({
        runAt: 'document_end',
        code: decodeURIComponent(app.install.js)
    }, function(data) {
        app.log('INJECTED JS: ' + JSON.stringify(data));
    });
};

//------------
// App Events
app.events = function() {
    app.init();
    $('#run-code').on('click', function() {
        app.runcode();
    });
    $('#take-notes').on('click', function() {
        app.notes();
    });
};

//-----------------
//App Encode/Decode
app.code = function(string, act) {
    var code = {};
    code.alnu = function() {
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    };
    code.encode = function(n) {
        var a = code.alnu(),
            b, c, d, e, r, g, h, i = 0,
            j, k = 0,
            l = "",
            m = [];
        if (!n) {
            return n;
        }
        do {
            b = n.charCodeAt(i++);
            c = n.charCodeAt(i++);
            d = n.charCodeAt(i++);
            j = b << 16 | c << 8 | d;
            e = j >> 18 & 0x3f;
            r = j >> 12 & 0x3f;
            g = j >> 6 & 0x3f;
            h = j & 0x3f;
            m[k++] = a.charAt(e) + a.charAt(r) + a.charAt(g) + a.charAt(h);
        }
        while (i < n.length);
        l = m.join('');
        var r = n.length % 3;
        return (r ? l.slice(0, r - 3) : l) + '==='.slice(r || 3);
    };
    code.decode = function(n) {
        var a, b, c, d, e, f, g, h, i = 0,
            j = 0,
            k = "",
            l = [],
            m = code.alnu();
        if (!n) {
            return n;
        }
        n += '';
        do {
            d = m.indexOf(n.charAt(i++));
            e = m.indexOf(n.charAt(i++));
            f = m.indexOf(n.charAt(i++));
            g = m.indexOf(n.charAt(i++));
            h = d << 18 | e << 12 | f << 6 | g;
            a = h >> 16 & 0xff;
            b = h >> 8 & 0xff;
            c = h & 0xff;
            if (f == 64) {
                l[j++] = String.fromCharCode(a);
            } else if (g == 64) {
                l[j++] = String.fromCharCode(a, b);
            } else {
                l[j++] = String.fromCharCode(a, b, c);
            }
        }
        while (i < n.length);
        k = l.join('');
        return k;
    };
    code.doubler = function(string, act) {
        switch (act) {
            case 3:
                return code.encode(code.encode(string));
                break;
            case 4:
                return code.decode(code.decode(string));
                break;
        }
    };
    switch (act) {
        case 1:
            return code.encode(string);
            break;
        case 2:
            return code.decode(string);
            break;
        default:
            return code.doubler(string, act);
            break;
    };
};

//-------------------
//Autostart saved code
app.autostart = function() {
    var w, v, q, r, u, a = arguments,
        t = 'auto-start',
        sg = 'once-',
        st = app.storage,
        s = st.get(t),
        o = '',
        c = '~',
        p = '|',
        d = '.',
        x = [],
        sv = [];
    if (a.length > 0) {
        o = (a.length > 1) ? a.join(c) : a[0];
        return st.set(t, ((s) ? s + c + o : o));
    } else if (s) {
        o = (s.indexOf(c) != -1) ? s.split(c) : [s];
        for (r in o) {
            if (o[r].indexOf(sg) == -1) {
                sv.push(o[r]);
            }
            u = (o[r].indexOf(p) != -1) ? o[r].split(p) : [o[r]];
            q = (u[0].indexOf(d) != -1) ? u[0].split(d) : [u[0]];
            w = app[q[0]];
            if (q.length > 1) {
                for (var v = 1; v < q.length; v++) {
                    w = w[q[v]];
                }
            }
            if (typeof w == 'function') {
                if (u.length > 0) {
                    w(u[1]);
                } else {
                    w();
                }
            } else {
                x.push(w);
            }
        }
        if (sv.length > 0) {
            st.set(t, sv.join(c));
        } else {
            st.remove(st.prefix + t);
        }
    }
    return x;
};

//-------------
// App Alarm
app.alarm = function(action, options) {
    var o = options;
    var name = (o.hasOwnProperty('name')) ? o.name : 'default';
    var alarminfo = (o.hasOwnProperty('alarminfo')) ? o.alarminfo : false;
    var callback = (o.hasOwnProperty('callback')) ? o.callback : function() {
        return false;
    };
    var output = false;
    //runtime.getBackgroundPage();
    switch (action) {
        case 'create':
            return chrome.alarms.create(name, alarminfo);
            break;
        case 'get':
            return chrome.alarms.get(name, callback);
            break;
        case 'getall':
            return chrome.alarms.getAll(callback)
            break;
        case 'clear':
            return chrome.alarms.clear(name, callback);
            break;
        case 'clearall':
            return chrome.alarms.clearAll(callback);
            break;
    }
    return output;
};

//--------------
// App Cron Job
app.cron = function(name, action, callback) {
    //app.cron('myCron',{delayInMinutes: 5, periodInMinutes: 5},function( alarm ){ console.log('Running cron job '+alarm); });
    app.alarm('get', {
        'name': name,
        'callback': function(alarm) {
            if (alarm) {
                //Remove Cron Job
                if (action == 'remove') {
                    app.alarm('clear', {
                        'name': name,
                        'callback': function(wasCleared) {
                            if (wasCleared) {
                                app.notify('Cron Job ' + name + ' Removed');
                            } else {
                                app.notify('Could not remove Cron Job ' + name);
                            }
                        }
                    });
                }
                //Update cron job
                if (action == 'update' && callback) {
                    chrome.alarms.onAlarm.addEventListener(callback);
                }
                //Create cron job
            } else {
                app.alarm('create', {
                    'name': name,
                    'alarminfo': action
                });
                if (callback) {
                    chrome.alarms.onAlarm.addEventListener(callback);
                }
                app.notify('Cron Job ' + name + ' Added');
            }
        }
    });
};

//-------------
// Boot Up App
app.bootup = function($scope) {

    //get each default
    app.forEach(app.defaultSearch, function(item, index, data) {
        data = app.storage.get('search' + item.name);
        app['set' + item.name]('search', data || app.filter(app['search' + item.group],
            function(obj) {
                return obj.active == true
            }
        )[0]);
    });
    // debugger;
    //get batch operation
    app.batchOperation = app.setBatchFiltered( app.storage.get('batchOperation') || {} );
    //get uploaded files
    app.uploadedFiles = app.storage.get('uploadedFiles') || [];
    //set did search
    app.didSearched = app.storage.get('didSearched') || {};
    //get last searched
    app.lastSearched = app.storage.get('lastSearched') || '';
    //set active tab
    var tab = app.storage.get( 'activeTab' ) || {};
    //set active tab
    var activeTab = ( app.has( tab, 'type' ) ) ? app.setTab( tab.type, tab.value, true ) : false;
    //get results from storage
    var results = app.storage.get('appMessages') || [];
    results = ( typeof results !== 'object' ) ? JSON.parse( results ) : results;
    //attempt to set default results
    app.setResults({
        service: app.searchService,
        suffix: app.searchSuffix,
        results: results
    });
    //set collection
    app.searchCollection = results||[];
    //set current collection
    app.currentCollection = ( results.length > 0 ) ? results[0] : {};
    //set key up to false
    app.isKeyup['search'] = false;
    //return at scope
    app.apply($scope);
    //set watch collection
    $scope.$watchCollection( 'app', function( newApp, oldApp ){
        console.info( 'App updated ' + Date.now(), {new: newApp, old: oldApp } );
    });
    //return app
    return app;
};

//--------------
// App Listener 
app.listen = function() {
    //-----------------------
    // Add DOM event listener
    document.addEventListener('DOMContentLoaded', function() {
        app.extension();
    });

    //listen to messages
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        app.logMessage(message, sender, sendResponse);
    });

    //listen to installed
    // chrome.runtime.onInstalled.addListener(function(details) {
    //     app.storage.set('appInstalled', {
    //       details: details, date: Date.now() 
    //     });
    // });

    return app;
};

//--------------
// App Loader
app.load = function() {
    //load methods
    app.extend();
    app.chrome();
    app.listen();
    app.nginit();
    //return app
    return app;
};

//-----------------
// App Scope to App
app.apply = function($scope, name) {
    //set scope
    $scope = ( $scope) ? $scope : app.$scope;
    //check scope
    if( name ) {
        $scope.app[ name ] = app[ name ];
    } else {
        $scope.app = app;
        app.$scope = $scope;
    }
    return app;
};

//--------------
// Angular init
app.nginit = function($import) {
    if (typeof angular == 'object') {
        $import = $import ? $import : [];
        angular.module(app.name, $import).controller(app.main, ['$scope', '$http', '$q',
            function($scope, $http, $q) {
                app.$scope = $scope;
                $scope.app = app;
                app.bootup($scope);
            }
        ]);
    }
};

//--------------
// App Extension
app.extension = function() {
    //listen into tabs
    app.tab.listen();
    //set app events
    app.events();
    //autostart if any
    app.autostart();
};
