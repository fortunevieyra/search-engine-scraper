# Personal Thought
Because scraping is still a big deal in the public domain, why not just go all out.
The original idea was to build a Google Search scraper that would be used to search any blog using a unique search term.
But it turned out to be very useful at scraping other search engines using what ever search term imaginable.
Personally, it has helped me download 18,000 blockchain whitepapers in roughly 2 weeks for research purpose :-).

# Search Engine Scraper

Search Engien Scraper is a Google Chrome extension that simply injects css and javascript on a search engine results page.
The goal is to create the ULTIMATE search engine scraper that works on all major search engines and social search engines.

## What's implemented so far?


### General Features
The following features are currently supported
* Search History       - View search results from previously searched terms 
* Search Collection    - Collection of search results from previous searches
* CSV File Upload      - Upload a CSV file and take a specific batch action
* Batch Processing     - Search multiple terms via batch processing


### General Configuration
General config.js options that you can update
* Ajax Support         - app.config.ajaxSettings
* Search Suffixes      - app.config.searchSuffixes
* Search Services      - app.config.searchServices

### App Configuration
For those who want to extend the app itself
* Main Tabs            - app.config.mainTabs
* File Actions         - app.config.fileActions
* Search Crawlers      - app.config.searchCrawlers
* App Settings         - app.config.appSettings
* Default Search       - app.config.defaultSearch


## Usage - Configuration
To make configuration changes, open the `./js/config.js` file.

### app.config.ajaxSettings

```javascript
app.config.ajaxSettings = {
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
};
```

### app.config.searchSuffixes

```javascript
app.config.searchSuffixes = [
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
];
```

### app.config.searchServices

```javascript
app.config.searchServices = [
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
];
```

### app.config.mainTabs

```javascript
app.config.mainTabs = [
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
}],
```


### app.config.fileActions

```javascript
app.config.fileActions = [
    {
        active: false,
        name: 'process',
        text: 'Batch Process'
    },
    {
        active: false,
        name: 'comment',
        text: 'Post Comment'
    }
];
```


### app.config.searchCrawlers

```javascript
app.config.searchCrawlers = [
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
];
```


### app.config.appSettings

```javascript
app.config.appSettings = [
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
];
```



### app.config.defaultSearch

```javascript
app.config.defaultSearch = [
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
];
```

## Usage - Extending
To safely extend the app object, open the `./js/extend.js` file.

### app.bind
Using the `app.bind` method, you can extend the app object

```javascript
app.bind({
    //say hello
    hello: function(){ return 'world'; }
});
```


### app.add
Using the `app.add` method, you can add more items to the app config options

```javascript
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
    }
], app.config.searchSuffixes );
```

### app.setActiveConfig
Using the `app.setActiveConfig` method, you can set an item in config options as active

```javascript
//single - append to existing object
app.setActiveConfig( 'searchSuffixes', 'white_paper_pdf' );
```


## Installing the Extension

To install the extension
* Launch the Chrome browser and go to `chrome://extensions`; you should see the extension listed.
* Click the `LOAD UNPACKED` button and select the directory where the extension is located


### License

MIT License. Copyright 2018 Fortune Vieyra


## Authors & contributors
* Fortune Vieyra <fortune@gredger.com>

