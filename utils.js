/**
 * set language from html tag and load content file
 */
export const SetLanguage = () => {
    const html = document.getElementsByTagName('html')[0];
    window.option = require("json!../assets/json/option.json");

    if (window.option.language === 'zh') {
        window.lang = 'zh';
        html.lang = 'zh';
        html.classList.add('is-oneSide');
    } else if (window.option.language === 'en') {
        window.lang = 'en';
        html.classList.add('is-oneSide');
    } else {
        window.lang = html.getAttribute('lang') || 'zh';
    }
    window.content = require("json!../assets/json/content.json");
    console.log('>>> lang: ' + window.lang);
}

/**
 * set title element text
 */
export const SetTitle = () => {
    document.title = window.option.title[window.lang];
}

/**
 * set meta description
 */
export const SetDescription = () => {
    let head = document.getElementsByTagName('head')[0];
    let meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', window.option.meta[window.lang]);
    head.insertBefore(meta, head.firstChild);
}

/**
 * set platform by browser's userAgent
 */
export const SetPlatform = () => {
    function detectPlatform() {
        if (navigator.userAgent.match(/Android/i)
            || navigator.userAgent.match(/webOS/i)
            || navigator.userAgent.match(/iPhone/i)
            || navigator.userAgent.match(/iPod/i)
            || navigator.userAgent.match(/BlackBerry/i)
            || navigator.userAgent.match(/Windows Phone/i)
        ) {
            return 'smartphone';
        } else if (navigator.userAgent.match(/iPad/i)) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }
    window.platform = detectPlatform();
    console.log('>>> platform: ' + window.platform);
}

/**
 * Modify site styles depending on cookie / login / platform
 */
export const SetCookieState = () => {
    /**
     * get cookie by name
     */
    function getCookie(name) {
        function escape(s) {
            return s.replace(/([.*+?\^${}()|\[\]\/\\])/g, '\\$1');
        };
        let match = document.cookie.match(RegExp('(?:^|;\\s*)' + escape(name) + '=([^;]*)'));
        return match ? match[1] : null;
    }

    /**
     * get if user is internal
     */
    const doIhaveACookie = getCookie('il') ? true : false;
    const amIComingFromR18 = document.referrer.indexOf("r18.com") > -1;
    const amIComingFromTheSamePage = document.referrer === window.location.href;
    const internalUser = (doIhaveACookie || (amIComingFromR18 && !amIComingFromTheSamePage)) ? true : false;
    console.log('>>> internal user: ' + internalUser);
    console.log('       - doIhaveACookie:', doIhaveACookie);
    console.log('       - amIComingFromR18:', amIComingFromR18);
    console.log('       - amIComingFromTheSamePage:', amIComingFromTheSamePage);

    /**
     * modify native header and footer
     */
    if (!internalUser) {
        if (window.platform === 'desktop') {
            const gDef = document.querySelector('.gDef');

            if (gDef !== null) {
                gDef.style.display = 'block';
                document.querySelector('#hd-sec-middle').style.display = 'none';
                document.querySelector('#hd-sec-bottom').style.display = 'none';
                document.querySelector('#contents').style.padding = '40px 0 110px';
                setTimeout(function () {
                    document.querySelector('#footer').style.display = 'block';
                    document.querySelector('#footer').style.height = '110px';
                    document.querySelector('#footer').style['margin-top'] = '-110px';
                    document.querySelector('#footer .inner01').style.display = 'none';
                    document.querySelector('.ft-list-nav02').style.display = 'none';
                }, 1000);
            }
        } else {
            const mainWrap = document.querySelector('.mainWrap');

            if (mainWrap !== null) {
                document.querySelector('.mainWrap > header').style.display = 'none';
                setTimeout(function () {
                    document.querySelector('.mainWrap > footer').style.display = 'none';
                }, 1000);
            }
        }
    }

    /**
     * modify root styles and custom header and footer
     */
    let root = document.getElementById('root');
    let fixedStyles;

    if (internalUser || window.platform === 'desktop') {
        // displaying normal dmm
        if (window.platform === 'desktop') {
            root.style.marginTop = '-2px';
            root.style.paddingBottom = internalUser ? '370px' : '0';
        } else {
            root.style.paddingTop = '78px';
            root.style.marginBottom = '-1px';
        }

        fixedStyles = {
            header: { display: 'none' },
            footer: { display: 'none' }
        };
    } else {
        if (window.platform === 'desktop') {
            root.style.marginTop = '-2px';
            root.style.paddingBottom = '0';
        } else if (window.platform === 'tablet') {
            root.style.marginTop = '56px';
            root.style.paddingBottom = '0';
        } else {
            root.style.marginTop = '48px';
            root.style.paddingBottom = '0';
        }

        fixedStyles = {
            header: { display: 'block' },
            footer: { display: 'block' }
        };
    }
    return fixedStyles;
}

/**
 * Call API to retrieve site data
 */
export const SetData = (itemCount, cb, err, sort) => {
    let params = {
        'price': window.option.projectInfo.price,
        'sort': sort,
        'page': window.option.projectInfo.page,
        'pagesize': window.option.projectInfo.pagesize,
        'service': window.option.projectInfo.service,
        'type': window.option.projectInfo.type,
        'id': window.option.projectInfo.id,
        'lang': window.lang,      // 'en'
        'unit': window.currency,  // 'EUR'
        'device': window.option.projectInfo.device,
        'safe': window.option.projectInfo.safe
    };

    /**
     * iterate data and make sure to return N items with all required params
     */
    function correctDataItems(_items) {
        console.log('correcting data...', itemCount);
        let items = [];

        for (let itemObj of _items) {

            // When the sort type is cheap, I turned off the actress name filter.
            // The number of cases was less than 16 cases.
            if (sort === 'cheap') {
                if (itemObj.sample === null) {
                    continue;
                }
            } else {
                if (Object.keys(itemObj.actress).length === 0 || itemObj.sample === null) {
                    continue;
                }
            }

            items.push(itemObj);
            if (items.length === itemCount) {
                return items;
            }
        }

        console.warn('correct data could not be completed');
        return _items;
    }

    /**
     * keep this as separate function for later refactor
     * should callback be handled here or in calling wrapper function?
     */
    function _doAJAX(url, method, params, callback, errorCallback) {
        // NO JQ VERSION - based on code from http://youmightnotneedjquery.com/
        // doesn't need to wait for jQuery to load..
        let xhr = new XMLHttpRequest();

        if ("withCredentials" in xhr) { // XHR for Chrome/Firefox/Opera/Safari.
            xhr.open(method, url, true);
        } else if (typeof XDomainRequest != "undefined") { // XDomainRequest for IE.
            xhr = new XDomainRequest();
            xhr.open(method, url);
        } else { // CORS not supported.
            xhr = null;
        }

        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        xhr.withCredentials = true;

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 400) {
                if (typeof callback === 'function') {
                    callback(xhr.responseText);
                } else {
                    return xhr.responseText;
                }
            } else {
                console.log('server returned 400+ error'); // We reached our target server, but it returned an error
                if (typeof errorCallback === 'function') errorCallback();
            }
        };

        xhr.onerror = function () { // There was a connection error of some sort
            if (typeof errorCallback === 'function') errorCallback();
        };

        if (method === 'POST') {
            xhr.send(params);
        } else {
            xhr.send();
        }
    }

    /**
     * prepare params for AJAX
     */
    function xparams(params) {
        let keys = Object.keys(params);
        let out = [];
        keys.map(function (a) {
            out.push(a + '=' + params[a])
        });
        return out.join('&');
    }

    /**
     * execute api call
     */
    _doAJAX(
        '/api/v1/content/list/',
        'POST',
        xparams(params),

        /**
         * callback handler
         */
        function (data) {
            // convert string to object
            data = JSON.parse(data);

            if (data.hasOwnProperty('items') && data.items.length > 0) {
                data.items = correctDataItems(data.items);
                cb(data);
            }
        },

        /**
         * error handler
         */
        function () {
            console.log('something went wrong');
            err();
        }
    );
}

/**
 * separate notifications by comma
 */
export const ToSeparate = (num) => {
    return String(num).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
}

/**
 * set sort parameter
 */
export const SetSortParam = () => {
    /**
     * get parameters from the URL
     */
    function getParamFromUrl(key) {
        let val = null;
        let reg = new RegExp(key + '=(.*?[^¥s])(&|$)');
        val = location.search.match(reg);
        if (val) {
            val = decodeURIComponent(val[1]);
        }
        return val;
    }

    let param = getParamFromUrl('camp_par');

    switch (param) {
        case 'sort_cheap':
            window.sort = 'cheap';
            window.tabIndex = 0;
            break;
        case 'sort_popular':
            window.sort = 'popular';
            window.tabIndex = 1;
            break;
        case 'sort_new':
            window.sort = 'new';
            window.tabIndex = 2;
            break;
        default:
            window.sort = null;
            window.tabIndex = null;
            break;
    }
}
