
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
    console.log(e);
  };
  IDBOpenDBRequest.onupgradeneeded = function(e) {
    yobotdb = e.target.result;
    if (!yobotdb.objectStoreNames.contains('img')) {
      console.log('创建img缓存');
      var imgStore = db.createObjectStore('img', {
        keypath: 'id',
        autoIncrement: false
      });
    }
  }).catch(error => {
    console.log(error);
  });
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
  return(localhostPath + projectName);
}

function getImg(key) {
  if (!yobotdb) {

  }
  else {
    var transaction = yobotdb.transaction('img', 'readwrite');
    var imgStore = transaction.objectStore('img');
    var request = store.get(key);
    request.onsuccess = function (e) {
      console.log(e.target.result.img)
      return;
    }
    request.onerror = function (e) {
      console.log('获取图片失败' + e);
      requestImg(key).then(function () {
        return getImd(key);
      });
    }
  }
}

async function requestImg(key) {
  axios.post(getRootPath() + 'img/' + key).then(response => {
    if (response.code !== 0) {
      alert('获取图片更新失败，错误消息\n' + response.data);
    }
    else
    {
      var transaction = yobotdb.transaction('img', 'readwrite');
      var imgStore = transaction.objectStore('img');
      for (d of response.data) {
        var request = imgStore.add({id: d['id'], img: d['img']});
        request.onsuccess = fucntion (e) {
          console.log('存储图片' + d['id']);
        };
        request.onerror = function (e) {
          console.log('存储图片失败' + e);
        };
      }
  });
  return;
}
