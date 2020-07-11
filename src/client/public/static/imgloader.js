
var indexedDB =
  window.indexedDB ||
  window.webkitIndexedDB ||
  window.mozIndexedDB ||
  window.msIndexedDB;

var yobotdb = undefined;

if (!indexedDB) {
  alert('浏览器不支持数据库缓存，加载图片时间将较长')
}
else {
  version = getImgVersion()
  var IDBOpenDBRequest = indexedDB.open('yobot', version);
  IDBOpenDBRequest.onsuccess = function(e) {
    console.log('打开数据库成功');
    yobotdb = e.target.result;
  };
  IDBOpenDBRequest.onerror = function(e) {
    console.log('打开数据库失败');
    console.log(e);
  };
  IDBOpenDBRequest.onupgradeneeded = function(e) {
    yobotdb = e.target.result;
    if (!yobotdb.objectStoreNames.contains('img')) {
      console.log('创建img缓存');
      var imgStore = yobotdb.createObjectStore('img', {
        keyPath: 'id',
      });
    }
  }
}

function getImgVersion() {
  return 1;
}

function getRootPath() {
  var curWwwPath = window.document.location.href;
  var pathName = window.document.location.pathname;
  var pos = curWwwPath.indexOf(pathName);
  var localhostPath = curWwwPath.substring(0, pos);
  var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
  return(localhostPath + projectName + '/');
}

function getImg(key, callback, retry=true) {
  console.log(key + ' ' + retry);
  if (!yobotdb) {

  }
  else {
    var transaction = yobotdb.transaction('img');
    var imgStore = transaction.objectStore('img');
    var request = imgStore.get(Number(key));
    request.onsuccess = function (e) {
      if (e.target.result) {
        return callback && callback(e.target.result['img'], key);
      }
      else if (retry) {
        return requestImg(key, callback);
      }
      else return callback && callback(undefined, key);
    }
    request.onerror = function (e) {
      console.log('获取图片失败' + e);
      if (retry) {
        return requestImg(key, callback);
      }
      else {
         return callback && callback(undefined, key);
      }
    }
  }
}

async function requestImg(key, callback) {
  axios.post(getRootPath() + 'img/' + key).then(response => {
    if (response.data.code !== 0) {
      console.log('获取图片更新失败，错误代码\n' + response.data.code);
    }
    else
    {
      if (!yobotdb) {
        for (d of response.data.data) {
          return callback && callback(d['img'], key);
        }
      }
      else {
        var transaction = yobotdb.transaction('img', 'readwrite');
        var imgStore = transaction.objectStore('img');
        for (d of response.data.data) {
          var request = imgStore.add({id: Number(d['id']), img: d['img']});
          request.onsuccess = function (e) {
            console.log('存储图片' + d['id']);
            getImg(key, callback, false);
          };
          request.onerror = function (e) {
            console.log('存储图片失败' + e);
            getImg(key, callback, false);
          };
        }
      }
    }
  });
}
