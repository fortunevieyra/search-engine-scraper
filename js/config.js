app.bind({
    config: {

        //------------------------------------------------------------------------
        //--- SAVE URL - THIS CAN SAVE SEARCH RESULTS TO A REMOTE WEB SERVICE  ---
        //--- Leave 'url' blank to ignore getting / posting search results data --
        //------------------------------------------------------------------------
        //set save data url
        ajaxSettings: {
            get: {
                url: '',
                headers: {
                    'accept': '*/*',
                    'cache-control': 'no-cache',
                    'x-requested-with': 'XMLHttpRequest',
                    'content-type': 'application/json; charset=UTF-8'
                },
                // success: function(){ },
                // failure: function(){ },
                // always: function(){ }
            },
            post: {
                url: '',
                headers: {
                    'accept': '*/*',
                    'cache-control': 'no-cache',
                    'x-requested-with': 'XMLHttpRequest',
                    'content-type': 'application/json; charset=UTF-8'
                },
                //comment to run default process
                // success: function(){ },
                // failure: function(){ },
                // always: function(){ }
            },
        },


        //------------------------------------------------------------------------
        //--- GENERAL - YOU ARE FREE TO CHANGE THE DEFAULT SUFFIX AND SERVICES ---
        //--- Changing the below will give you want a different set of options ---
        //------------------------------------------------------------------------
        //search suffixes
        searchSuffixes: [
            {
                active: true,
                name: 'wordpress_blog',
                value: ' blog "wordpress.com"'
            },
            {
                active: false,
                name: 'wikipedia_wiki',
                value: ' wiki "wikipedia.com"'
            },
            {
                active: false,
                name: 'youtube_video',
                value: ' video "youtube.com"'
            }, 
            {
                active: false,
                name: 'google_patent',
                value: ' google patent "uspts.gov"'
            },
            {
                active: false,
                name: 'whois_search',
                value: ' "domain information" "whois.com"'
            }
        ],
        //search services
        searchServices: [
            {
                text: '',
                active: true,
                enable: true,
                name: 'google',
                icon: 'google',
                url: 'https://www.google.com/search?q=',
                clickButton: false,
                searchButton: '#sfdiv button[type="submit"]',
                searchForm: '#tsf',
                searchText: '#lst-ib,.gLFyf.gsfi',
                resultLink: '#rso div.srg div.g div.rc h3 a',
                resultDesc: '#rso div.srg div.g div.rc div.s div .st',
                pagifyLink: '#nav a.fl',
                otherTerms: '#brs div.card-section div.brs_col p a',
                repeatLink: '#ofr a',
                pageNumber: '&num=',
                pageStart: '&start=',
                spawnCount: 25,
                resultSize: 100,
                resultAdd: 0
            }, 
            {
                text: '',
                active: false,
                enable: true,
                name: 'bing',
                icon: 'internet-explorer',
                url: 'https://www.bing.com/search?q=',
                clickButton: false,
                searchButton: '#sb_form_go',
                searchForm: '#sb_form',
                searchText: '#sb_form_q',
                resultLink: '#b_results .b_algo h2 a',
                resultDesc: '#b_results .b_algo div.b_caption p',
                pagifyLink: 'ul.sb_pagF li a',
                otherTerms: '#b_results .b_ans .b_rs .b_rich div ul li a',
                repeatLink: '#b_results .b_msg a',
                pageNumber: false,
                pageStart: '&first=',
                spawnCount: 25,
                resultSize: 50,
                resultAdd: 0
            }, 
            {
                text: '',
                active: false,
                enable: true,
                name: 'yahoo',
                icon: 'yahoo',
                url: 'https://search.yahoo.com?p=',
                clickButton: true,
                searchButton: '#sf input[type="submit"]',
                searchForm: '#sf',
                searchText: '#yschsp',
                resultLink: 'ol.searchCenterMiddle .compTitle h3 a',
                resultDesc: 'ol.searchCenterMiddle .compText p',
                pagifyLink: '.compPagination a',
                otherTerms: '.AlsoTry table tbody tr td a',
                repeatLink: false,
                pageNumber: '&pz=',
                pageStart: '&b=',
                spawnCount: 25,
                resultSize: 100,
                resultAdd: 1

            }, 
            {
                text: '',
                active: false,
                enable: false,
                name: 'yandex',
                icon: 'yahoo',
                url: 'http://www.yandex.com/search/?text=',
                clickButton: true,
                searchButton: '.search2__button button[type="submit"]',
                searchForm: '.search2',
                searchText: '.search2__input input[type="search"]',
                resultLink: '.serp-item .serp-item__title a',
                resultDesc: '.serp-item .serp-item__text',
                pagifyLink: '.pager_js_inited a',
                otherTerms: false,
                repeatLink: false,
                pageNumber: false,
                pageStart: '&p=',
                spawnCount: 25,
                resultSize: 1,
                resultAdd: 0
            }, 
            {
                text: '',
                active: false,
                enable: true,
                name: 'duckduckgo',
                icon: 'search-plus',
                url: 'http://www.duckduckgo.com/?q=',
                clickButton: true,
                searchButton: '#search_button',
                searchForm: '#search_form',
                searchText: '#search_form_input',
                resultLink: '.result__body h2 a.result__check',
                resultDesc: '.result__body .result__snippet',
                pagifyLink: false,
                otherTerms: false,
                repeatLink: false,
                pageNumber: false,
                pageStart: false,
                spawnCount: false,
                resultSize: false,
                resultAdd: false
            }
        ],
        //------------------------------------------------------------------------
        //--- CAUTION - DO NOT EDIT BELOW UNLESS YOU WANT TO REBUILD THIS APP  ---
        //--- Changing the below will require code changes to the core.js file ---
        //------------------------------------------------------------------------
        //main tabs
        mainTabs: [
            {
                name: 'collection',
                text: 'Collection',
                total: 0
            },
            {
                name: 'search',
                text: 'Search Results',
                total: 0
            },
            {
                name: 'upload',
                text: 'Upload File',
                total: 0
            },
            {
                name: 'comment',
                text: 'Post Comment',
                total: 0
            },
            {
                name: 'process',
                text: 'Batch Process',
                total: 0
            }
        ],
         //file actions
        fileActions: [{
                active: false,
                name: 'process',
                text: 'Batch Process'
            },
            {
                active: false,
                name: 'comment',
                text: 'Post Comment'
            }
        ],
        //search crawlers
        searchCrawlers: [
            {
                name: 'search',
                active: false
            }, {
                name: 'suffix',
                active: true
            },
            {
                name: 'locale',
                active: false
            }
        ],
        //app settings
        appSettings: [
            {
                active: false,
                name: 'service',
                value: 'Edit Services',
                callback: app.editServices
            }, {
                active: false,
                name: 'suffix',
                value: 'Edit Suffixes',
                callback: app.editSuffixes
            }, {
                active: false,
                name: 'reload',
                value: 'Reload Application',
                callback: app.reloadApplication
            }
        ],
        //default search
        defaultSearch: [
            {
                name: 'Crawler',
                group: 'Crawlers',
            }, {
                name: 'Service',
                group: 'Services'
            }, {
                name: 'Suffix',
                group: 'Suffixes'
            }
        ]

    }
});